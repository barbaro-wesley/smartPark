"use client";

import { cn } from "@/lib/utils";
import type { ParkingStatus } from "@/types/parking";

interface MetricCardsProps {
  status: ParkingStatus | null;
}

export function MetricCards({ status }: MetricCardsProps) {
  const livre = status?.livre ?? 0;
  const ocupado = status?.ocupado ?? 0;
  const pct = status?.porcentagem_ocupacao ?? 0;
  const fluxo = status?.fluxo ?? 0;

  const cards = [
    {
      label: "Vagas Livres",
      value: livre,
      max: 4,
      icon: "🟢",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Vagas Ocupadas",
      value: ocupado,
      max: 4,
      icon: "🔴",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "Ocupação",
      value: `${pct}%`,
      icon: "📊",
      color: pct >= 100 ? "text-red-400" : pct >= 75 ? "text-amber-400" : "text-sky-400",
      bg:
        pct >= 100
          ? "bg-red-500/10 border-red-500/20"
          : pct >= 75
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Entradas Hoje",
      value: fluxo,
      icon: "🚦",
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      role="region"
      aria-label="Métricas do estacionamento"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "rounded-xl border p-4 flex flex-col gap-1 transition-all duration-300",
            card.bg
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-lg" aria-hidden="true">{card.icon}</span>
          </div>
          <div className={cn("text-3xl font-bold font-mono tabular-nums", card.color)}>
            {card.value}
          </div>
          {"max" in card && (
            <div className="text-xs text-zinc-600 font-mono">
              de {card.max} vagas
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
