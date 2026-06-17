"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useParkingStore } from "@/hooks/useParkingStore";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { ParkingMap } from "@/components/features/ParkingMap";
import { MetricCards } from "@/components/features/MetricCards";
import { OccupancyChart } from "@/components/features/OccupancyChart";
import { OccupancyBar } from "@/components/features/OccupancyBar";
import { EventLog } from "@/components/features/EventLog";
import { AlertPanel } from "@/components/features/AlertPanel";

// ─── Cabeçalho de seção ─────────────────────────────────────────────────────
function SectionHeader({
  title,
  accent = "sky",
}: {
  title: string;
  accent?: "emerald" | "sky" | "violet" | "amber" | "zinc";
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    zinc: "bg-zinc-500",
  };
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn("w-0.5 h-4 rounded-full", colors[accent])} />
      <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em]">
        {title}
      </h2>
    </div>
  );
}

// ─── Hero de disponibilidade ─────────────────────────────────────────────────
function StatusHero({
  livre,
  total,
  pct,
}: {
  livre: number;
  total: number;
  pct: number;
}) {
  const isLotado = pct >= 100;
  const isQuase = pct >= 50 && pct < 100;

  const config = isLotado
    ? {
        label: "LOTADO",
        sub: "Nenhuma vaga disponível",
        textColor: "text-red-400",
        border: "border-red-500/30",
        bg: "bg-red-500/8",
        badge: "bg-red-500/15 border-red-500/30 text-red-300",
        dot: "bg-red-400",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        ),
      }
    : isQuase
    ? {
        label: "ÚLTIMA VAGA",
        sub: "Atenção: quase cheio",
        textColor: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-500/8",
        badge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        dot: "bg-amber-400 animate-pulse",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        ),
      }
    : {
        label: "DISPONÍVEL",
        sub: "Estacionamento com vagas livres",
        textColor: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/8",
        badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        dot: "bg-emerald-400 animate-pulse",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        ),
      };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-center justify-between gap-4 transition-all duration-500",
        config.border,
        config.bg
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("shrink-0", config.textColor)}>{config.icon}</span>
        <div>
          <div className={cn("text-xl font-bold font-mono tracking-tight leading-none", config.textColor)}>
            {config.label}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{config.sub}</div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0",
          config.badge
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", config.dot)} />
        <span className="font-mono font-bold text-sm tabular-nums">
          {livre}/{total}
        </span>
        <span className="text-[10px] font-mono opacity-70">livres</span>
      </div>
    </div>
  );
}

// ─── Skeleton de carregamento ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
      <div className="h-3 w-20 bg-zinc-800 rounded mb-3" />
      <div className="h-7 w-12 bg-zinc-800 rounded mb-2" />
      <div className="h-2 w-16 bg-zinc-800/60 rounded" />
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { status, historico, eventos, alertas, loading, error, wsStatus } =
    useParkingStore();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const alertasAtivos = alertas.filter((a) => a.ativo).length;
  const pct = status?.porcentagem_ocupacao ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Gradiente atmosférico */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-72 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(59,130,246,0.08), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg text-sm"
      >
        Ir para o conteúdo principal
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
              <span className="text-sky-400 font-bold text-sm font-mono">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none text-zinc-100">
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
      <main
        id="main"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {/* Loading */}
        {loading && (
          <div role="status" aria-busy="true" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-80 animate-pulse" />
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-16 animate-pulse" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-14 animate-pulse" />
              </div>
            </div>
            <span className="sr-only">Carregando dados do sistema…</span>
          </div>
        )}

        {/* Erro de conexão */}
        {error && !loading && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/8 p-4"
          >
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Falha na conexão com o backend
            </div>
            <p className="text-xs text-zinc-500 font-mono">{error}</p>
            <p className="text-xs text-zinc-600 mt-1.5">
              Verifique se o Raspberry Pi está acessível em{" "}
              <code className="text-zinc-500 bg-zinc-800 px-1 rounded">:5000</code>
            </p>
          </div>
        )}

        {!loading && (
          <>
            {/* Banner de alertas ativos */}
            {alertasAtivos > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center gap-2.5 text-xs font-mono text-amber-400"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {alertasAtivos === 1 ? "1 alerta ativo" : `${alertasAtivos} alertas ativos`}
                {" "}— veja o painel abaixo
              </div>
            )}

            {/* ── Linha 1: Mapa + Painel de status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mapa */}
              <section aria-labelledby="mapa-titulo">
                <SectionHeader title="Mapa de Vagas" accent="emerald" />
                <ParkingMap status={status} />
              </section>

              {/* Status + Métricas */}
              <section aria-labelledby="metricas-titulo" className="flex flex-col gap-4">
                <SectionHeader title="Status em Tempo Real" accent="sky" />

                {/* Hero de disponibilidade */}
                <StatusHero
                  livre={status?.livre ?? 0}
                  total={status?.total ?? 2}
                  pct={pct}
                />

                {/* Cards de métricas */}
                <MetricCards status={status} />

                {/* Barra de ocupação */}
                <OccupancyBar porcentagem={pct} />
              </section>
            </div>

            {/* ── Linha 2: Gráfico histórico ── */}
            <section aria-labelledby="historico-titulo">
              <SectionHeader title="Ocupação Histórica" accent="violet" />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <OccupancyChart historico={historico} />
                <p className="text-[10px] text-zinc-600 font-mono mt-3 text-center">
                  Vagas ocupadas por snapshot · últimas leituras
                </p>
              </div>
            </section>

            {/* ── Linha 3: Alertas + Log de Eventos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section aria-labelledby="alertas-titulo">
                <SectionHeader title="Alertas do Sistema" accent="amber" />
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <AlertPanel alertas={alertas} />
                </div>
              </section>

              <section aria-labelledby="eventos-titulo">
                <SectionHeader title="Log de Eventos" accent="zinc" />
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <EventLog eventos={eventos} />
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="text-[10px] text-zinc-700 font-mono text-center pb-4">
              Hardware Architecture · ATITUS Educação · Profa. Dra. Thaísa Leal da Silva
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
