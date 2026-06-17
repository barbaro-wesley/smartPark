"use client";

import { cn } from "@/lib/utils";
import type { ParkingStatus } from "@/types/parking";

interface MetricCardsProps {
  status: ParkingStatus | null;
}

function IconFree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3v-3.5l1.5-4h11l1.5 4V17h-2m-5 0H8m8 0a1 1 0 11-2 0 1 1 0 012 0zM7 17a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function IconFlow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M13 6l6 6-6 6" />
    </svg>
  );
}

export function MetricCards({ status }: MetricCardsProps) {
  const livre = status?.livre ?? 0;
  const ocupado = status?.ocupado ?? 0;
  const fluxo = status?.fluxo ?? 0;
  const TOTAL = 2;

  const cards = [
    {
      label: "Vagas Livres",
      value: livre,
      sub: `de ${TOTAL} vagas`,
      Icon: IconFree,
      iconClass: "text-emerald-400",
      valueClass: "text-emerald-400",
      bg: "bg-emerald-500/8 border-emerald-500/20",
    },
    {
      label: "Ocupadas",
      value: ocupado,
      sub: `de ${TOTAL} vagas`,
      Icon: IconCar,
      iconClass: "text-red-400",
      valueClass: "text-red-400",
      bg: "bg-red-500/8 border-red-500/20",
    },
    {
      label: "Entradas Hoje",
      value: fluxo,
      sub: "veículos",
      Icon: IconFlow,
      iconClass: "text-violet-400",
      valueClass: "text-violet-400",
      bg: "bg-violet-500/8 border-violet-500/20",
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-3"
      role="region"
      aria-label="Métricas do estacionamento"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "rounded-xl border p-3 flex flex-col gap-1.5 transition-all duration-300",
            card.bg
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider leading-none">
              {card.label}
            </span>
            <card.Icon className={cn("w-4 h-4", card.iconClass)} />
          </div>
          <div className={cn("text-3xl font-bold font-mono tabular-nums leading-none", card.valueClass)}>
            {card.value}
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
