"use client";

import { useState, useEffect } from "react";
import { useParkingStore } from "@/hooks/useParkingStore";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { ParkingMap } from "@/components/features/ParkingMap";
import { MetricCards } from "@/components/features/MetricCards";
import { OccupancyChart } from "@/components/features/OccupancyChart";
import { OccupancyBar } from "@/components/features/OccupancyBar";
import { EventLog } from "@/components/features/EventLog";
import { AlertPanel } from "@/components/features/AlertPanel";

export default function DashboardPage() {
  const { status, historico, eventos, alertas, loading, error, wsStatus } =
    useParkingStore();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const alertasAtivos = alertas.filter((a) => a.ativo).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Skip link — acessibilidade */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg text-sm"
      >
        Ir para o conteúdo principal
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo / Título */}
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">🅿️</span>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">
                Smart Parking
              </h1>
              <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
                Smart Campus · ATITUS
              </p>
            </div>
          </div>

          {/* Badges + relógio */}
          <div className="flex items-center gap-4">
            <ConnectionBadge
              wsStatus={wsStatus}
              arduinoConectado={status?.arduino_conectado ?? false}
            />
            <time
              dateTime={now.toISOString()}
              className="text-xs font-mono text-zinc-500 hidden sm:block tabular-nums"
            >
              {now.toLocaleTimeString("pt-BR")}
            </time>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Estado de loading */}
        {loading && (
          <div
            className="flex items-center justify-center py-16 text-zinc-500 text-sm"
            role="status"
            aria-busy="true"
          >
            <span className="animate-pulse">Carregando dados do sistema…</span>
          </div>
        )}

        {/* Estado de erro */}
        {error && !loading && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 font-mono"
          >
            ⚠️ Erro ao conectar ao backend: {error}
            <br />
            <span className="text-zinc-500 text-xs">
              Verifique se o Raspberry Pi está ligado e acessível em{" "}
              <code>:5000</code>
            </span>
          </div>
        )}

        {!loading && (
          <>
            {/* Alerta de vagas crítico (banner topo) */}
            {alertasAtivos > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-mono text-amber-400 flex items-center gap-2"
              >
                <span aria-hidden="true">⚠️</span>
                {alertasAtivos === 1
                  ? "1 alerta ativo"
                  : `${alertasAtivos} alertas ativos`}{" "}
                — veja o painel abaixo
              </div>
            )}

            {/* ── Linha 1: Mapa + Métricas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mapa visual */}
              <section aria-labelledby="mapa-titulo">
                <h2
                  id="mapa-titulo"
                  className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3"
                >
                  Mapa de Vagas
                </h2>
                <ParkingMap status={status} />
              </section>

              {/* Métricas + barra ocupação */}
              <section aria-labelledby="metricas-titulo" className="flex flex-col gap-4">
                <h2
                  id="metricas-titulo"
                  className="text-xs font-mono text-zinc-500 uppercase tracking-widest"
                >
                  Métricas em Tempo Real
                </h2>
                <MetricCards status={status} />
                <OccupancyBar porcentagem={status?.porcentagem_ocupacao ?? 0} />
              </section>
            </div>

            {/* ── Linha 2: Gráfico histórico ── */}
            <section aria-labelledby="historico-titulo">
              <h2
                id="historico-titulo"
                className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3"
              >
                Ocupação Histórica
              </h2>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <OccupancyChart historico={historico} />
                <p className="text-[10px] text-zinc-600 font-mono mt-2 text-center">
                  Vagas ocupadas por snapshot (últimas leituras)
                </p>
              </div>
            </section>

            {/* ── Linha 3: Alertas + Log de Eventos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section aria-labelledby="alertas-titulo">
                <h2
                  id="alertas-titulo"
                  className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3"
                >
                  Alertas do Sistema
                </h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <AlertPanel alertas={alertas} />
                </div>
              </section>

              <section aria-labelledby="eventos-titulo">
                <h2
                  id="eventos-titulo"
                  className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3"
                >
                  Log de Eventos
                </h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <EventLog eventos={eventos} />
                </div>
              </section>
            </div>

            {/* ── Footer info ── */}
            <footer className="text-[10px] text-zinc-700 font-mono text-center pb-4">
              Hardware Architecture · ATITUS Educação · Profa. Dra. Thaísa Leal da Silva
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
