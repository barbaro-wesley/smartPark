"use client";

import { cn } from "@/lib/utils";
import type { ParkingState } from "@/hooks/useParkingStore";

interface ConnectionBadgeProps {
  wsStatus: ParkingState["wsStatus"];
  arduinoConectado: boolean;
}

const WS_LABELS: Record<ParkingState["wsStatus"], string> = {
  connecting: "Conectando...",
  connected: "Online",
  disconnected: "Desconectado",
  error: "Erro",
};

export function ConnectionBadge({
  wsStatus,
  arduinoConectado,
}: ConnectionBadgeProps) {
  const wsOnline = wsStatus === "connected";

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      {/* WebSocket */}
      <span
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
          wsOnline
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : wsStatus === "connecting"
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
            : "border-red-500/40 bg-red-500/10 text-red-400"
        )}
        aria-label={`WebSocket: ${WS_LABELS[wsStatus]}`}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            wsOnline
              ? "bg-emerald-400 animate-pulse"
              : wsStatus === "connecting"
              ? "bg-amber-400 animate-pulse"
              : "bg-red-400"
          )}
        />
        WS · {WS_LABELS[wsStatus]}
      </span>

      {/* Arduino */}
      <span
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
          arduinoConectado
            ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
            : "border-red-500/40 bg-red-500/10 text-red-400"
        )}
        aria-label={`Arduino: ${arduinoConectado ? "conectado" : "desconectado"}`}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            arduinoConectado ? "bg-sky-400" : "bg-red-400"
          )}
        />
        Arduino · {arduinoConectado ? "OK" : "Offline"}
      </span>
    </div>
  );
}
