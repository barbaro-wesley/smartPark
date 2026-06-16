"""
motor_regras.py — Motor de regras e sistema de alertas
Condições conforme CLAUDE.md §7, tabela de alertas automáticos
"""

import logging
import time
import threading
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Optional
from uuid import uuid4

from serial_reader import StatusArduino

logger = logging.getLogger(__name__)


@dataclass
class Alerta:
    id: str
    tipo: str
    mensagem: str
    timestamp: str
    ativo: bool = True

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tipo": self.tipo,
            "mensagem": self.mensagem,
            "timestamp": self.timestamp,
            "ativo": self.ativo,
        }


class SistemaAlertas:
    """Gerencia alertas ativos e notifica via callback."""

    def __init__(self, on_alerta: Callable[[Alerta], None],
                 on_alerta_resolvido: Callable[[str], None]):
        self._alertas: dict[str, Alerta] = {}
        self._on_alerta = on_alerta
        self._on_alerta_resolvido = on_alerta_resolvido
        self._lock = threading.Lock()

    def ativar(self, tipo: str, mensagem: str) -> Alerta:
        """Ativa alerta. Se já existe alerta ativo do mesmo tipo, não duplica."""
        with self._lock:
            # Verifica se já existe um alerta ativo desse tipo
            for alerta in self._alertas.values():
                if alerta.tipo == tipo and alerta.ativo:
                    return alerta

            alerta = Alerta(
                id=str(uuid4())[:8],
                tipo=tipo,
                mensagem=mensagem,
                timestamp=datetime.now().isoformat(),
                ativo=True,
            )
            self._alertas[alerta.id] = alerta
            logger.warning("Alerta ativado [%s]: %s", tipo, mensagem)

        self._on_alerta(alerta)
        return alerta

    def resolver(self, tipo: str) -> None:
        """Resolve todos os alertas ativos de determinado tipo."""
        resolvidos: list[str] = []

        with self._lock:
            for alerta in self._alertas.values():
                if alerta.tipo == tipo and alerta.ativo:
                    alerta.ativo = False
                    resolvidos.append(alerta.id)

        for aid in resolvidos:
            logger.info("Alerta resolvido [%s] id=%s", tipo, aid)
            self._on_alerta_resolvido(aid)

    def alertas_ativos(self) -> list[dict]:
        with self._lock:
            return [a.to_dict() for a in self._alertas.values() if a.ativo]

    def todos(self) -> list[dict]:
        with self._lock:
            return [a.to_dict() for a in self._alertas.values()]


class MotorRegras:
    """
    Avalia o status recebido do Arduino e dispara alertas conforme
    as regras definidas no CLAUDE.md §7.

    Regras implementadas:
      - livre == 0            → Estacionamento lotado
      - livre == 1            → Última vaga disponível
      - Sensor sem leitura >5s  → Sensor offline (futuro: monitorado pelo Arduino)
      - Arduino sem dados >10s  → Arduino desconectado
      - Fluxo > 20 em 10min   → Alto fluxo de entrada
    """

    LIMIAR_ALTO_FLUXO = 20
    JANELA_FLUXO_S = 600  # 10 minutos

    def __init__(self, alertas: SistemaAlertas):
        self._alertas = alertas
        self._historico_fluxo: list[tuple[float, int]] = []   # (timestamp, fluxo)
        self._ultimo_fluxo = 0
        self._lock = threading.Lock()

    def avaliar(self, status: StatusArduino) -> None:
        """Deve ser chamado a cada status recebido do Arduino."""
        self._verificar_lotado(status)
        self._verificar_ultima_vaga(status)
        self._verificar_alto_fluxo(status)

    def verificar_arduino_offline(self, arduino_online: bool) -> None:
        """Chamado periodicamente pelo watchdog."""
        if not arduino_online:
            self._alertas.ativar(
                "arduino_desconectado",
                "Arduino não envia dados há mais de 10 segundos"
            )
        else:
            self._alertas.resolver("arduino_desconectado")

    # ──────────────────────────────────────────────────────────────────────
    # Regras individuais
    # ──────────────────────────────────────────────────────────────────────

    def _verificar_lotado(self, status: StatusArduino) -> None:
        if status.livre == 0:
            self._alertas.ativar("lotado", "Estacionamento lotado — nenhuma vaga disponível")
            # Garante que "ultima_vaga" é resolvido quando já está lotado
            self._alertas.resolver("ultima_vaga")
        else:
            self._alertas.resolver("lotado")

    def _verificar_ultima_vaga(self, status: StatusArduino) -> None:
        if status.livre == 1:
            self._alertas.ativar("ultima_vaga", "Atenção: apenas 1 vaga disponível")
        elif status.livre > 1:
            self._alertas.resolver("ultima_vaga")

    def _verificar_alto_fluxo(self, status: StatusArduino) -> None:
        agora = time.time()
        with self._lock:
            # Registra fluxo se mudou
            if status.fluxo != self._ultimo_fluxo:
                self._historico_fluxo.append((agora, status.fluxo))
                self._ultimo_fluxo = status.fluxo

            # Remove entradas fora da janela
            self._historico_fluxo = [
                (ts, f) for ts, f in self._historico_fluxo
                if agora - ts <= self.JANELA_FLUXO_S
            ]

            # Calcula entradas na janela (diferença entre max e min de fluxo)
            if len(self._historico_fluxo) >= 2:
                fluxo_min = self._historico_fluxo[0][1]
                fluxo_max = self._historico_fluxo[-1][1]
                entradas_na_janela = max(0, fluxo_max - fluxo_min)
            else:
                entradas_na_janela = 0

        if entradas_na_janela > self.LIMIAR_ALTO_FLUXO:
            self._alertas.ativar(
                "alto_fluxo",
                f"Alto fluxo: {entradas_na_janela} entradas nos últimos 10 minutos"
            )
        else:
            self._alertas.resolver("alto_fluxo")
