

import logging
import os
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sock import Sock

logger = logging.getLogger(__name__)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


def criar_app(db, ws_manager, serial_reader=None, alertas_sistema=None) -> Flask:
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    sock = Sock(app)

    # ── WebSocket ─────────────────────────────────────────────────────────

    @sock.route("/ws")
    def ws_endpoint(ws):
        ws_manager.registrar(ws)
        logger.info("WS conectado. Total: %d", ws_manager.total_clientes())
        try:
            while True:
                msg = ws.receive(timeout=30)
                if msg is None:
                    break
        except Exception as e:
            logger.debug("WS encerrado: %s", e)
        finally:
            ws_manager.remover(ws)

    # ── Dashboard (SPA) ───────────────────────────────────────────────────

    @app.route("/")
    def index():
        if os.path.exists(os.path.join(STATIC_DIR, "index.html")):
            return send_from_directory(STATIC_DIR, "index.html")
        return jsonify({"msg": "Dashboard não encontrado. Rode `npm run build`."}), 200

    @app.route("/<path:path>")
    def static_files(path):
        full = os.path.join(STATIC_DIR, path)
        if os.path.exists(full):
            return send_from_directory(STATIC_DIR, path)
        if os.path.exists(os.path.join(STATIC_DIR, "index.html")):
            return send_from_directory(STATIC_DIR, "index.html")
        return jsonify({"erro": "Arquivo não encontrado"}), 404

    # ── GET /api/status ───────────────────────────────────────────────────

    @app.route("/api/status")
    def api_status():
        status_dict = (
            serial_reader.status_atual().to_dict()
            if serial_reader else _status_offline()
        )
        alertas = alertas_sistema.todos() if alertas_sistema else []
        return jsonify({
            "status": status_dict,
            "historico": db.buscar_historico_recente(30),
            "eventos": db.buscar_eventos_recentes(20),
            "alertas": alertas,
        })

    # ── GET /api/eventos ──────────────────────────────────────────────────

    @app.route("/api/eventos")
    def api_eventos():
        try:
            limite = max(1, min(500, int(request.args.get("limite", 100))))
        except ValueError:
            limite = 100
        return jsonify(db.buscar_eventos(limite))

    # ── GET /api/estatisticas ─────────────────────────────────────────────

    @app.route("/api/estatisticas")
    def api_estatisticas():
        dados = db.buscar_estatisticas_hoje() or {
            "data": datetime.now().date().isoformat(),
            "total_entradas": 0, "total_saidas": 0,
            "pico_ocupacao": 0, "hora_pico": "--:--",
            "media_ocupacao": 0.0, "tempo_medio_min": 0.0,
        }
        return jsonify(dados)

    # ── GET /api/relatorio ────────────────────────────────────────────────

    @app.route("/api/relatorio")
    def api_relatorio():
        return jsonify(db.buscar_relatorio_semanal())

    # ── GET /api/historico ────────────────────────────────────────────────

    @app.route("/api/historico")
    def api_historico():
        try:
            horas = max(1, min(168, int(request.args.get("horas", 24))))
        except ValueError:
            horas = 24
        return jsonify(db.buscar_historico(horas))

    # ── GET /api/health ───────────────────────────────────────────────────

    @app.route("/api/health")
    def api_health():
        arduino_ok = serial_reader.arduino_online() if serial_reader else False
        return jsonify({
            "status": "ok",
            "arduino": arduino_ok,
            "ws_clientes": ws_manager.total_clientes(),
            "timestamp": datetime.now().isoformat(),
        })

    # ── Erros ─────────────────────────────────────────────────────────────

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"erro": "Rota não encontrada"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Erro interno: %s", e)
        return jsonify({"erro": "Erro interno do servidor"}), 500

    return app


def _status_offline() -> dict:
    return {
        "vagas": {1: "livre", 2: "livre", 3: "livre", 4: "livre"},
        "livre": 4, "ocupado": 0, "fluxo": 0, "total": 4,
        "porcentagem_ocupacao": 0,
        "timestamp": datetime.now().isoformat(),
        "arduino_conectado": False,
    }
