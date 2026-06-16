"""
websocket_manager.py — Gerencia conexões WebSocket e broadcast de mensagens
Utiliza flask-sock para comunicação em tempo real conforme CLAUDE.md §7
"""

import json
import logging
import threading
from typing import Any

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Mantém a lista de conexões WebSocket ativas e oferece
    broadcast thread-safe para todas elas.
    """

    def __init__(self):
        self._clientes: set = set()
        self._lock = threading.Lock()

    def registrar(self, ws: Any) -> None:
        with self._lock:
            self._clientes.add(ws)
        logger.debug("WS conectado. Total: %d", len(self._clientes))

    def remover(self, ws: Any) -> None:
        with self._lock:
            self._clientes.discard(ws)
        logger.debug("WS desconectado. Total: %d", len(self._clientes))

    def broadcast(self, payload: dict) -> None:
        """Envia `payload` como JSON para todos os clientes conectados."""
        dados = json.dumps(payload, ensure_ascii=False)
        mortos: list = []

        with self._lock:
            clientes = list(self._clientes)

        for ws in clientes:
            try:
                ws.send(dados)
            except Exception as e:
                logger.debug("Cliente WS removido por erro: %s", e)
                mortos.append(ws)

        for ws in mortos:
            self.remover(ws)

    def total_clientes(self) -> int:
        with self._lock:
            return len(self._clientes)

    # ──────────────────────────────────────────────────────────────────────
    # Helpers de payload — tipagem explícita conforme tipos do frontend
    # ──────────────────────────────────────────────────────────────────────

    def enviar_status(self, status_dict: dict) -> None:
        self.broadcast({"type": "status", "data": status_dict})

    def enviar_evento(self, evento_dict: dict) -> None:
        self.broadcast({"type": "evento", "data": evento_dict})

    def enviar_alerta(self, alerta_dict: dict) -> None:
        self.broadcast({"type": "alerta", "data": alerta_dict})

    def enviar_alerta_resolvido(self, alerta_id: str) -> None:
        self.broadcast({"type": "alerta_resolvido", "id": alerta_id})
