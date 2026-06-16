"""
raspberry_estacionamento.py — Ponto de entrada do Smart Parking

Uso:
  python3 raspberry_estacionamento.py
  python3 raspberry_estacionamento.py --porta /dev/ttyUSB0
  python3 raspberry_estacionamento.py --demo
"""

import argparse
import logging
import os
import signal
import sys
import threading
import time
from datetime import datetime

from banco_dados import BancoDados
from flask_app import criar_app
from motor_regras import MotorRegras, SistemaAlertas
from serial_reader import SerialReader, StatusArduino
from websocket_manager import WebSocketManager

# ── Logging ───────────────────────────────────────────────────────────────

_LOG_DIR = os.environ.get("DATA_DIR", ".")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-8s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(_LOG_DIR, "parking.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger("main")


class SmartParkingApp:

    HOST = "0.0.0.0"
    PORT = 5000
    HISTORICO_INTERVALO_S = 60
    WATCHDOG_INTERVALO_S = 5

    def __init__(self, porta_serial: str | None, modo_demo: bool = False):
        self._modo_demo = modo_demo
        self._parar = threading.Event()

        # Camadas
        self.db = BancoDados()
        self.ws_manager = WebSocketManager()
        self.alertas_sistema = SistemaAlertas(
            on_alerta=self._on_alerta,
            on_alerta_resolvido=self._on_alerta_resolvido,
        )
        self.motor = MotorRegras(self.alertas_sistema)

        if modo_demo:
            self.serial = None
            logger.warning("Modo DEMO ativado — sem Arduino físico")
        else:
            self.serial = SerialReader(
                porta=porta_serial,
                on_status=self._on_status,
                on_evento=self._on_evento,
            )

        # Flask com todas as dependências injetadas
        self.app = criar_app(
            db=self.db,
            ws_manager=self.ws_manager,
            serial_reader=self.serial,
            alertas_sistema=self.alertas_sistema,
        )

    # ── Callbacks SerialReader ────────────────────────────────────────────

    def _on_status(self, status: StatusArduino) -> None:
        self.ws_manager.enviar_status(status.to_dict())
        self.motor.avaliar(status)
        self.db.atualizar_pico(status.ocupado)

    def _on_evento(self, tipo: str, mensagem: str) -> None:
        evento_id = self.db.registrar_evento(tipo, mensagem)
        self.ws_manager.enviar_evento({
            "id": evento_id,
            "timestamp": datetime.now().isoformat(),
            "tipo": tipo,
            "mensagem": mensagem,
        })
        if tipo == "entrada":
            self.db.incrementar_entradas()
        elif tipo == "saida":
            self.db.incrementar_saidas()
        logger.info("Evento [%s]: %s", tipo, mensagem)

    # ── Callbacks SistemaAlertas ──────────────────────────────────────────

    def _on_alerta(self, alerta) -> None:
        self.ws_manager.enviar_alerta(alerta.to_dict())
        self.db.registrar_evento("alerta", alerta.mensagem)

    def _on_alerta_resolvido(self, alerta_id: str) -> None:
        self.ws_manager.enviar_alerta_resolvido(alerta_id)

    # ── Threads de suporte ────────────────────────────────────────────────

    def _thread_historico(self) -> None:
        logger.info("Thread histórico iniciada (%ds)", self.HISTORICO_INTERVALO_S)
        while not self._parar.wait(self.HISTORICO_INTERVALO_S):
            if self.serial:
                s = self.serial.status_atual()
                self.db.salvar_historico(
                    s.v1, s.v2, s.v3, s.v4, s.livre, s.ocupado, s.fluxo
                )
                self.db.atualizar_media_ocupacao()

    def _thread_watchdog(self) -> None:
        logger.info("Watchdog iniciado (%ds)", self.WATCHDOG_INTERVALO_S)
        while not self._parar.wait(self.WATCHDOG_INTERVALO_S):
            online = self.serial.arduino_online() if self.serial else False
            self.motor.verificar_arduino_offline(online)

    def _thread_demo(self) -> None:
        """Simula dados do Arduino sem hardware."""
        import random
        logger.info("Thread demo iniciada")
        vagas = [0, 0, 0, 0]
        fluxo = 0

        while not self._parar.wait(2.5):
            idx = random.randint(0, 3)
            vagas[idx] = 1 - vagas[idx]

            if vagas[idx] == 1:
                fluxo += 1
                self._on_evento("entrada", "Carro detectado na entrada [DEMO]")
                time.sleep(0.1)
                self._on_evento("ocupada", f"Vaga {idx+1} ocupada [DEMO]")
            else:
                self._on_evento("saida", "Carro saiu [DEMO]")
                time.sleep(0.1)
                self._on_evento("liberada", f"Vaga {idx+1} liberada [DEMO]")

            status = StatusArduino(
                v1=vagas[0], v2=vagas[1], v3=vagas[2], v4=vagas[3],
                livre=vagas.count(0), fluxo=fluxo,
                arduino_conectado=True,
            )
            self._on_status(status)

    # ── Inicialização ─────────────────────────────────────────────────────

    def iniciar(self) -> None:
        logger.info("=" * 60)
        logger.info("Smart Parking — ATITUS Educação")
        logger.info("=" * 60)

        if self.serial:
            self.serial.start()

        threads = [
            threading.Thread(target=self._thread_historico, name="Historico", daemon=True),
            threading.Thread(target=self._thread_watchdog, name="Watchdog", daemon=True),
        ]
        if self._modo_demo:
            threads.append(
                threading.Thread(target=self._thread_demo, name="Demo", daemon=True)
            )

        for t in threads:
            t.start()

        logger.info("Dashboard: http://%s:%d", self.HOST, self.PORT)
        logger.info("API:       http://%s:%d/api/status", self.HOST, self.PORT)

        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

        self.app.run(
            host=self.HOST,
            port=self.PORT,
            debug=False,
            use_reloader=False,
            threaded=True,
        )

    def _shutdown(self, _sig, _frame) -> None:
        logger.info("Encerrando...")
        self._parar.set()
        if self.serial:
            self.serial.parar()
        sys.exit(0)


# ── CLI ───────────────────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smart Parking — Backend Raspberry Pi")
    parser.add_argument("--porta", "-p", default=None,
                        help="Porta serial (ex: /dev/ttyUSB0). Auto-detecta se omitido.")
    parser.add_argument("--demo", "--sem-serial", action="store_true",
                        help="Modo demo sem Arduino (dados simulados).")
    parser.add_argument("--port", type=int, default=5000,
                        help="Porta HTTP (padrão: 5000).")
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    SmartParkingApp.PORT = args.port
    SmartParkingApp(porta_serial=args.porta, modo_demo=args.demo).iniciar()
