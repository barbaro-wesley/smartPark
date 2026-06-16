"""
banco_dados.py — Wrapper SQLite para o Smart Parking
Tabelas conforme CLAUDE.md §7: historico, eventos, estatisticas_diarias
"""

import sqlite3
import logging
import threading
from datetime import datetime, date
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = "parking.db"

# DDL — idêntico ao especificado no CLAUDE.md §7
_DDL = """
CREATE TABLE IF NOT EXISTS historico (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT    NOT NULL,
    v1        INTEGER,
    v2        INTEGER,
    v3        INTEGER,
    v4        INTEGER,
    livre     INTEGER,
    ocupado   INTEGER,
    fluxo     INTEGER
);

CREATE TABLE IF NOT EXISTS eventos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    tipo      TEXT NOT NULL,
    mensagem  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estatisticas_diarias (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    data            TEXT    NOT NULL UNIQUE,
    total_entradas  INTEGER DEFAULT 0,
    total_saidas    INTEGER DEFAULT 0,
    pico_ocupacao   INTEGER DEFAULT 0,
    hora_pico       TEXT    DEFAULT '',
    media_ocupacao  REAL    DEFAULT 0.0,
    tempo_medio_min REAL    DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_historico_ts   ON historico (timestamp);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo   ON eventos   (tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_ts     ON eventos   (timestamp);
"""


class BancoDados:
    """Thread-safe SQLite wrapper com connection-per-thread."""

    def __init__(self, path: str = DB_PATH):
        self._path = path
        self._local = threading.local()
        self._init_schema()

    # ──────────────────────────────────────────────────────────────────────
    # Conexão
    # ──────────────────────────────────────────────────────────────────────

    def _conn(self) -> sqlite3.Connection:
        """Retorna (ou cria) conexão para a thread atual."""
        if not hasattr(self._local, "conn") or self._local.conn is None:
            conn = sqlite3.connect(self._path)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            self._local.conn = conn
        return self._local.conn

    def _init_schema(self) -> None:
        conn = self._conn()
        conn.executescript(_DDL)
        conn.commit()
        logger.info("Banco de dados inicializado em '%s'", self._path)

    # ──────────────────────────────────────────────────────────────────────
    # Histórico
    # ──────────────────────────────────────────────────────────────────────

    def salvar_historico(
        self,
        v1: int, v2: int, v3: int, v4: int,
        livre: int, ocupado: int, fluxo: int,
    ) -> None:
        sql = """
            INSERT INTO historico (timestamp, v1, v2, v3, v4, livre, ocupado, fluxo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        ts = datetime.now().isoformat()
        try:
            conn = self._conn()
            conn.execute(sql, (ts, v1, v2, v3, v4, livre, ocupado, fluxo))
            conn.commit()
        except sqlite3.Error as e:
            logger.error("Erro ao salvar histórico: %s", e)

    def buscar_historico(self, horas: int = 24) -> list[dict]:
        sql = """
            SELECT * FROM historico
            WHERE timestamp >= datetime('now', ?)
            ORDER BY timestamp ASC
        """
        param = f"-{horas} hours"
        try:
            rows = self._conn().execute(sql, (param,)).fetchall()
            return [dict(r) for r in rows]
        except sqlite3.Error as e:
            logger.error("Erro ao buscar histórico: %s", e)
            return []

    def buscar_historico_recente(self, limite: int = 30) -> list[dict]:
        sql = "SELECT * FROM historico ORDER BY timestamp DESC LIMIT ?"
        try:
            rows = self._conn().execute(sql, (limite,)).fetchall()
            return [dict(r) for r in reversed(rows)]
        except sqlite3.Error as e:
            logger.error("Erro ao buscar histórico recente: %s", e)
            return []

    # ──────────────────────────────────────────────────────────────────────
    # Eventos
    # ──────────────────────────────────────────────────────────────────────

    def registrar_evento(self, tipo: str, mensagem: str) -> int:
        """Insere evento e retorna o id gerado."""
        sql = "INSERT INTO eventos (timestamp, tipo, mensagem) VALUES (?, ?, ?)"
        ts = datetime.now().isoformat()
        try:
            conn = self._conn()
            cur = conn.execute(sql, (ts, tipo, mensagem))
            conn.commit()
            return cur.lastrowid or 0
        except sqlite3.Error as e:
            logger.error("Erro ao registrar evento: %s", e)
            return -1

    def buscar_eventos(self, limite: int = 50) -> list[dict]:
        sql = "SELECT * FROM eventos ORDER BY timestamp DESC LIMIT ?"
        try:
            rows = self._conn().execute(sql, (limite,)).fetchall()
            return [dict(r) for r in rows]
        except sqlite3.Error as e:
            logger.error("Erro ao buscar eventos: %s", e)
            return []

    def buscar_eventos_recentes(self, limite: int = 20) -> list[dict]:
        return self.buscar_eventos(limite)

    # ──────────────────────────────────────────────────────────────────────
    # Estatísticas diárias
    # ──────────────────────────────────────────────────────────────────────

    def incrementar_entradas(self) -> None:
        self._upsert_stat("total_entradas", incrementar=True)

    def incrementar_saidas(self) -> None:
        self._upsert_stat("total_saidas", incrementar=True)

    def atualizar_pico(self, ocupado: int) -> None:
        """Atualiza pico de ocupação do dia se o valor atual for maior."""
        hoje = date.today().isoformat()
        sql_select = "SELECT pico_ocupacao FROM estatisticas_diarias WHERE data = ?"
        sql_update = """
            UPDATE estatisticas_diarias
            SET pico_ocupacao = ?, hora_pico = ?
            WHERE data = ? AND pico_ocupacao < ?
        """
        try:
            conn = self._conn()
            self._garantir_linha_hoje(conn, hoje)
            row = conn.execute(sql_select, (hoje,)).fetchone()
            pico_atual = row["pico_ocupacao"] if row else 0
            if ocupado > pico_atual:
                hora_pico = datetime.now().strftime("%H:%M")
                conn.execute(sql_update, (ocupado, hora_pico, hoje, ocupado))
                conn.commit()
        except sqlite3.Error as e:
            logger.error("Erro ao atualizar pico: %s", e)

    def atualizar_media_ocupacao(self) -> None:
        """Recalcula média de ocupação do dia com base no histórico."""
        hoje = date.today().isoformat()
        sql = """
            UPDATE estatisticas_diarias
            SET media_ocupacao = (
                SELECT AVG(CAST(ocupado AS REAL))
                FROM historico
                WHERE timestamp LIKE ? || '%'
            )
            WHERE data = ?
        """
        try:
            conn = self._conn()
            conn.execute(sql, (hoje, hoje))
            conn.commit()
        except sqlite3.Error as e:
            logger.error("Erro ao atualizar média: %s", e)

    def buscar_estatisticas_hoje(self) -> Optional[dict]:
        hoje = date.today().isoformat()
        try:
            conn = self._conn()
            self._garantir_linha_hoje(conn, hoje)
            row = conn.execute(
                "SELECT * FROM estatisticas_diarias WHERE data = ?", (hoje,)
            ).fetchone()
            return dict(row) if row else None
        except sqlite3.Error as e:
            logger.error("Erro ao buscar estatísticas: %s", e)
            return None

    def buscar_relatorio_semanal(self) -> list[dict]:
        sql = """
            SELECT * FROM estatisticas_diarias
            WHERE data >= date('now', '-7 days')
            ORDER BY data DESC
        """
        try:
            rows = self._conn().execute(sql).fetchall()
            return [dict(r) for r in rows]
        except sqlite3.Error as e:
            logger.error("Erro ao buscar relatório semanal: %s", e)
            return []

    # ──────────────────────────────────────────────────────────────────────
    # Helpers internos
    # ──────────────────────────────────────────────────────────────────────

    def _upsert_stat(self, campo: str, incrementar: bool = False) -> None:
        hoje = date.today().isoformat()
        try:
            conn = self._conn()
            self._garantir_linha_hoje(conn, hoje)
            if incrementar:
                conn.execute(
                    f"UPDATE estatisticas_diarias SET {campo} = {campo} + 1 WHERE data = ?",
                    (hoje,),
                )
            conn.commit()
        except sqlite3.Error as e:
            logger.error("Erro em _upsert_stat(%s): %s", campo, e)

    @staticmethod
    def _garantir_linha_hoje(conn: sqlite3.Connection, hoje: str) -> None:
        conn.execute(
            "INSERT OR IGNORE INTO estatisticas_diarias (data) VALUES (?)",
            (hoje,),
        )
        conn.commit()
