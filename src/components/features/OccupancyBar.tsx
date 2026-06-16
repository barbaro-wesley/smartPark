"use client";

import { cn } from "@/lib/utils";

interface OccupancyBarProps {
  porcentagem: number; // 0–100
}

export function OccupancyBar({ porcentagem }: OccupancyBarProps) {
  const pct = Math.max(0, Math.min(100, porcentagem));

  const color =
    pct >= 100
      ? "bg-red-500"
      : pct >= 75
      ? "bg-amber-500"
      : pct >= 50
      ? "bg-sky-500"
      : "bg-emerald-500";

  const label =
    pct >= 100 ? "Lotado" : pct >= 75 ? "Quase cheio" : pct >= 50 ? "Moderado" : "Disponível";

  return (
    <div
      className="flex flex-col gap-2"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Ocupação: ${pct}%`}
    >
      <div className="flex justify-between text-xs font-mono text-zinc-500">
        <span>0%</span>
        <span className={cn("font-bold", pct >= 100 ? "text-red-400" : pct >= 75 ? "text-amber-400" : "text-sky-400")}>
          {label} — {pct}%
        </span>
        <span>100%</span>
      </div>

      <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
        {/* Marcadores 25%, 50%, 75% */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-zinc-700"
            style={{ left: `${m}%` }}
          />
        ))}

        {/* Barra de progresso */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            color
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
