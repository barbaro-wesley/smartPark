"""
serial_reader.py — Thread de leitura e parse da serial do Arduino
Protocolo conforme CLAUDE.md §6

Mensagens esperadas:
  Status periódico (1s):  V1:1,V2:0,V3:1,V4:1,LIVRE:3,FLUXO:12\n
  Evento (imediato):      EVT:tipo|mensagem\n
  Boot:                   SISTEMA:OK\n
"""

import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Optional

import serial
import serial.tools.list_ports

logger = logging.getLogger(__name__)

# Tipos de evento válidos conforme protocolo serial
TIPOS_EVENTO_VALIDOS = frozenset({
    "ocupada", "liberada", "entrada", "saida",
    "cancela", "lotado", "alerta", "sistema",
})


TOTAL_VAGAS = 2


@dataclass
class StatusArduino:
    """Snapshot do último status recebido do Arduino."""
    v1: int = 0
    v2: int = 0
    v3: int = 0
    v4: int = 0
    livre: int = TOTAL_VAGAS
    fluxo: int = 0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    arduino_conectado: bool = False

    @property
    def ocupado(self) -> int:
        return self.v1 + self.v2 + self.v3 + self.v4

    @property
    def porcentagem_ocupacao(self) -> int:
        total = self.livre + self.ocupado
        return int((self.ocupado / total) * 100) if total else 0

    def to_dict(self) -> dict:
        return {
            "vagas": {
                1: "ocupada" if self.v1 else "livre",
                2: "ocupada" if self.v2 else "livre",
                3: "ocupada" if self.v3 else "livre",
                4: "ocupada" if self.v4 else "livre",
            },
            "livre": self.livre,
            "ocupado": self.ocupado,
            "fluxo": self.fluxo,
            "total": self.livre + self.ocupado,
            "porcentagem_ocupacao": self.porcentagem_ocupacao,
            "timestamp": self.timestamp,
            "arduino_conectado": self.arduino_conectado,
        }


class SerialReader(threading.Thread):
    """
    Thread daemon que lê continuamente a porta serial do Arduino.

    Parâmetros
    ----------
    porta : str
        Caminho da porta serial (ex: '/dev/ttyUSB0').
        Se None, tenta detecção automática.
    baud : int
        Taxa de transmissão — 9600 conforme CLAUDE.md §6.
    on_status : Callable[[StatusArduino], None]
        Callback chamado quando um status periódico é parseado.
    on_evento : Callable[[str, str], None]
        Callback chamado com (tipo, mensagem) quando EVT: é recebido.
    """

    BAUD = 9600
    TIMEOUT_DADOS_S = 10       # Segundos sem dados → alerta arduino offline
    RECONEXAO_DELAY_S = 5      # Aguarda antes de tentar reconectar

    def __init__(
        self,
        porta: Optional[str],
        on_status: Callable[[StatusArduino], None],
        on_evento: Callable[[str, str], None],
    ):
        super().__init__(name="SerialReader", daemon=True)
        self._porta = porta or self._detectar_porta()
        self._on_status = on_status
        self._on_evento = on_evento
        self._parar = threading.Event()
        self._ultimo_dado: float = 0.0
        self._status_atual = StatusArduino()
        self._lock = threading.Lock()
        self._carros_dentro: int = 0
        self._fluxo: int = 0

    # ──────────────────────────────────────────────────────────────────────
    # Interface pública
    # ──────────────────────────────────────────────────────────────────────

    def status_atual(self) -> StatusArduino:
        with self._lock:
            return self._status_atual

    def parar(self) -> None:
        self._parar.set()

    def arduino_online(self) -> bool:
        if self._ultimo_dado == 0:
            return False
        return (time.time() - self._ultimo_dado) < self.TIMEOUT_DADOS_S

    # ──────────────────────────────────────────────────────────────────────
    # Thread principal
    # ──────────────────────────────────────────────────────────────────────

    def run(self) -> None:
        logger.info("SerialReader iniciado — porta: %s @ %d baud", self._porta, self.BAUD)
        while not self._parar.is_set():
            try:
                self._conectar_e_ler()
            except Exception as e:
                logger.warning("Erro na serial, reconectando em %ds: %s",
                               self.RECONEXAO_DELAY_S, e)
                self._marcar_offline()
                time.sleep(self.RECONEXAO_DELAY_S)

    def _conectar_e_ler(self) -> None:
        with serial.Serial(
            port=self._porta,
            baudrate=self.BAUD,
            timeout=2,
        ) as ser:
            logger.info("Porta serial aberta: %s", self._porta)
            while not self._parar.is_set():
                linha = ser.readline().decode("utf-8", errors="replace").strip()
                if not linha:
                    continue
                self._ultimo_dado = time.time()
                self._processar_linha(linha)

    def _processar_linha(self, linha: str) -> None:
        logger.debug("Serial RX: %s", linha)

        # ── Boot ──────────────────────────────────────────────────────────
        if linha.startswith("SISTEMA:") or linha == "Sistema iniciado":
            msg = linha.split(":", 1)[1].strip() if ":" in linha else linha
            self._on_evento("sistema", f"Arduino: {msg}")
            return

        # ── Cartão detectado ──────────────────────────────────────────────
        if linha.startswith("Cartao:"):
            uid = linha.split(":", 1)[1].strip()
            self._on_evento("sistema", f"Cartao detectado: {uid}")
            return

        # ── Entrada liberada ──────────────────────────────────────────────
        if linha == "Entrada liberada":
            self._fluxo += 1
            self._carros_dentro = min(self._carros_dentro + 1, TOTAL_VAGAS)
            self._emitir_status()
            self._on_evento("entrada", "Entrada liberada")
            return

        # ── Saída liberada ────────────────────────────────────────────────
        if linha == "Saida liberada":
            self._carros_dentro = max(self._carros_dentro - 1, 0)
            self._emitir_status()
            self._on_evento("saida", "Saida liberada")
            return

        # ── Entrada negada ────────────────────────────────────────────────
        if linha == "Entrada negada":
            self._on_evento("lotado", "Entrada negada - estacionamento cheio")
            return

        # ── Catraca ───────────────────────────────────────────────────────
        if linha in ("Catraca abriu", "Catraca fechou"):
            self._on_evento("cancela", linha)
            return

        # ── Protocolo V1/V2 (compatibilidade futura) ──────────────────────
        if "V1:" in linha and "LIVRE:" in linha:
            self._processar_status(linha)
            return

        # ── Evento formato EVT: (compatibilidade futura) ──────────────────
        if linha.startswith("EVT:"):
            self._processar_evento(linha[4:])
            return

        logger.debug("Linha não reconhecida: %s", linha)

    def _emitir_status(self) -> None:
        """Gera um StatusArduino baseado no estado interno de carros/fluxo."""
        v1 = 1 if self._carros_dentro >= 1 else 0
        v2 = 1 if self._carros_dentro >= 2 else 0
        livre = TOTAL_VAGAS - self._carros_dentro
        status = StatusArduino(
            v1=v1, v2=v2, v3=0, v4=0,
            livre=livre,
            fluxo=self._fluxo,
            timestamp=datetime.now().isoformat(),
            arduino_conectado=True,
        )
        with self._lock:
            self._status_atual = status
        self._on_status(status)

    # ──────────────────────────────────────────────────────────────────────
    # Parsers
    # ──────────────────────────────────────────────────────────────────────

    def _processar_status(self, linha: str) -> None:
        """Parse: V1:1,V2:0,V3:1,V4:1,LIVRE:3,FLUXO:12"""
        try:
            campos: dict[str, int] = {}
            for par in linha.split(","):
                chave, valor = par.split(":")
                campos[chave.strip()] = int(valor.strip())

            status = StatusArduino(
                v1=campos.get("V1", 0),
                v2=campos.get("V2", 0),
                v3=campos.get("V3", 0),
                v4=campos.get("V4", 0),
                livre=campos.get("LIVRE", 4),
                fluxo=campos.get("FLUXO", 0),
                timestamp=datetime.now().isoformat(),
                arduino_conectado=True,
            )

            with self._lock:
                self._status_atual = status

            self._on_status(status)

        except (ValueError, KeyError) as e:
            logger.warning("Falha ao parsear status '%s': %s", linha, e)

    def _processar_evento(self, payload: str) -> None:
        """Parse: tipo|mensagem"""
        try:
            if "|" not in payload:
                raise ValueError("Separador '|' ausente")
            tipo, mensagem = payload.split("|", 1)
            tipo = tipo.strip().lower()
            mensagem = mensagem.strip()

            if tipo not in TIPOS_EVENTO_VALIDOS:
                logger.warning("Tipo de evento desconhecido: '%s'", tipo)
                tipo = "sistema"

            self._on_evento(tipo, mensagem)

        except ValueError as e:
            logger.warning("Falha ao parsear evento '%s': %s", payload, e)

    # ──────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────

    def _marcar_offline(self) -> None:
        with self._lock:
            self._status_atual = StatusArduino(
                arduino_conectado=False,
                timestamp=datetime.now().isoformat(),
            )

    @staticmethod
    def _detectar_porta() -> str:
        """Tenta identificar automaticamente a porta do Arduino."""
        candidatos = serial.tools.list_ports.comports()
        for port in candidatos:
            desc = (port.description or "").lower()
            if any(kw in desc for kw in ("arduino", "ch340", "cp210", "ftdi", "usb serial")):
                logger.info("Arduino detectado automaticamente: %s (%s)",
                            port.device, port.description)
                return port.device

        # Fallback — tenta ttyACM0 antes de ttyUSB0 (Arduino Uno/Mega via USB nativo)
        for fallback in ("/dev/ttyACM0", "/dev/ttyUSB0"):
            import os as _os
            if _os.path.exists(fallback):
                logger.warning("Arduino não detectado automaticamente. Usando fallback: %s", fallback)
                return fallback

        logger.warning("Nenhuma porta serial encontrada. Usando /dev/ttyUSB0 como padrão.")
        return "/dev/ttyUSB0"
