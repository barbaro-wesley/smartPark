import { cn } from "@/lib/utils";
import { useParkingContext } from "@/context/ParkingContext";
import { NavBar } from "@/components/ui/NavBar";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { ParkingMap } from "@/components/features/ParkingMap";
import { OccupancyBar } from "@/components/features/OccupancyBar";
import { AlertPanel } from "@/components/features/AlertPanel";

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
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        ),
      };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 flex items-center justify-between gap-4 transition-all duration-500",
        config.border,
        config.bg
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn("shrink-0", config.textColor)}>{config.icon}</span>
        <div>
          <div className={cn("text-3xl font-bold font-mono tracking-tight leading-none", config.textColor)}>
            {config.label}
          </div>
          <div className="text-sm text-zinc-500 mt-1">{config.sub}</div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-lg border shrink-0",
          config.badge
        )}
      >
        <span className={cn("w-2.5 h-2.5 rounded-full", config.dot)} />
        <span className="font-mono font-bold text-xl tabular-nums">
          {livre}/{total}
        </span>
        <span className="text-xs font-mono opacity-70">livres</span>
      </div>
    </div>
  );
}

export default function PainelPage() {
  const { status, alertas, loading, error, wsStatus } = useParkingContext();

  const pct = status?.porcentagem_ocupacao ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-72 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(16,185,129,0.07), transparent)",
        }}
        aria-hidden="true"
      />

      <NavBar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Barra de status de conexão */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Painel em Tempo Real</h2>
          <ConnectionBadge
            wsStatus={wsStatus}
            arduinoConectado={status?.arduino_conectado ?? false}
          />
        </div>

        {loading && (
          <div className="space-y-4" role="status" aria-busy="true">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-24 animate-pulse" />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-64 animate-pulse" />
            <span className="sr-only">Carregando…</span>
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/8 p-4">
            <p className="text-red-400 font-semibold text-sm">Falha na conexão com o backend</p>
            <p className="text-xs text-zinc-500 font-mono mt-1">{error}</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Hero de status */}
            <StatusHero
              livre={status?.livre ?? 0}
              total={status?.total ?? 2}
              pct={pct}
            />

            {/* Mapa de vagas */}
            <section aria-labelledby="mapa-titulo">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-0.5 h-4 rounded-full bg-emerald-500" />
                <h2
                  id="mapa-titulo"
                  className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em]"
                >
                  Mapa de Vagas
                </h2>
              </div>
              <ParkingMap status={status} />
            </section>

            {/* Barra de ocupação */}
            <OccupancyBar porcentagem={pct} />

            {/* Alertas */}
            <section aria-labelledby="alertas-titulo">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-0.5 h-4 rounded-full bg-amber-500" />
                <h2
                  id="alertas-titulo"
                  className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em]"
                >
                  Alertas do Sistema
                </h2>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <AlertPanel alertas={alertas} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
