"use client";

import { cn, formatTime } from "@/lib/utils";
import type { Alerta, AlertaTipo } from "@/types/parking";

interface AlertPanelProps {
  alertas: Alerta[];
}

const ALERTA_CONFIG: Record<AlertaTipo, { icon: string; label: string; color: string }> = {
  lotado: { icon: "🔴", label: "Lotado", color: "border-red-500/40 bg-red-500/10 text-red-400" },
  ultima_vaga: { icon: "🟡", label: "Última vaga", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  sensor_offline: { icon: "📡", label: "Sensor offline", color: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
  arduino_desconectado: { icon: "🔌", label: "Arduino offline", color: "border-red-500/40 bg-red-500/10 text-red-400" },
  alto_fluxo: { icon: "🚦", label: "Alto fluxo", color: "border-violet-500/40 bg-violet-500/10 text-violet-400" },
};

export function AlertPanel({ alertas }: AlertPanelProps) {
  const ativos = alertas.filter((a) => a.ativo);

  return (
    <div
      role="region"
      aria-label="Alertas ativos"
      aria-live="assertive"
    >
      {ativos.length === 0 ? (
        <p className="text-xs text-zinc-600 font-mono py-2 text-center">
          ✓ Nenhum alerta ativo
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ativos.map((alerta) => {
            const cfg = ALERTA_CONFIG[alerta.tipo];
            return (
              <li
                key={alerta.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-lg border text-xs font-mono",
                  cfg.color
                )}
                role="alert"
              >
                <span aria-hidden="true">{cfg.icon}</span>
                <div className="flex-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] opacity-70 mb-0.5">
                    {cfg.label}
                  </div>
                  <div>{alerta.mensagem}</div>
                </div>
                <span className="text-zinc-500 shrink-0 tabular-nums">
                  {formatTime(alerta.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
