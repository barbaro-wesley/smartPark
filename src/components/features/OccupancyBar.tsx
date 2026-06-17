"use client";

import { cn } from "@/lib/utils";

interface OccupancyBarProps {
  porcentagem: number; // 0–100
}

export function OccupancyBar({ porcentagem }: OccupancyBarProps) {
  const pct = Math.max(0, Math.min(100, porcentagem));

  const gradientColor =
    pct >= 100
      ? "from-red-600 to-red-400"
      : pct >= 75
      ? "from-amber-600 to-amber-400"
      : pct >= 50
      ? "from-sky-600 to-sky-400"
      : "from-emerald-600 to-emerald-400";

  const labelColor =
    pct >= 100
      ? "text-red-400"
      : pct >= 75
      ? "text-amber-400"
      : pct >= 50
      ? "text-sky-400"
      : "text-emerald-400";

  const glowColor =
    pct >= 100
      ? "shadow-[0_0_12px_rgba(239,68,68,0.5)]"
      : pct >= 75
      ? "shadow-[0_0_12px_rgba(245,158,11,0.4)]"
      : "";

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
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-zinc-600">Lotação geral</span>
        <span className={cn("font-bold tabular-nums", labelColor)}>
          {label} · {pct}%
        </span>
      </div>

      <div className="relative h-4 rounded-full bg-zinc-800/80 overflow-hidden border border-zinc-700/40">
        {/* Marcadores 25 / 50 / 75 */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-zinc-700/60 z-10"
            style={{ left: `${m}%` }}
          />
        ))}

        {/* Barra de progresso com gradiente */}
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            gradientColor,
            pct > 0 ? glowColor : ""
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Labels de escala */}
      <div className="flex justify-between text-[10px] font-mono text-zinc-700 px-0.5">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
