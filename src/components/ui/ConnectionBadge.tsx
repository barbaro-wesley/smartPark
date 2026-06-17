"use client";

import { cn } from "@/lib/utils";
import type { ParkingState } from "@/hooks/useParkingStore";

interface ConnectionBadgeProps {
  wsStatus: ParkingState["wsStatus"];
  arduinoConectado: boolean;
}

export function ConnectionBadge({ wsStatus, arduinoConectado }: ConnectionBadgeProps) {
  const wsOnline = wsStatus === "connected";
  const wsConnecting = wsStatus === "connecting";

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {/* WebSocket / Servidor */}
      <span
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-300",
          wsOnline
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : wsConnecting
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
            : "border-red-500/40 bg-red-500/10 text-red-400"
        )}
        aria-label={`Servidor: ${wsOnline ? "online" : wsConnecting ? "conectando" : "offline"}`}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            wsOnline
              ? "bg-emerald-400 animate-pulse"
              : wsConnecting
              ? "bg-amber-400 animate-pulse"
              : "bg-red-400"
          )}
        />
        <span className="hidden sm:inline">
          Servidor ·{" "}
        </span>
        {wsOnline ? "Online" : wsConnecting ? "Conectando…" : "Offline"}
      </span>

      {/* Arduino / Hardware */}
      <span
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-300",
          arduinoConectado
            ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
            : "border-red-500/40 bg-red-500/10 text-red-400"
        )}
        aria-label={`Hardware: ${arduinoConectado ? "conectado" : "desconectado"}`}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            arduinoConectado ? "bg-sky-400 animate-pulse" : "bg-red-400"
          )}
        />
        <span className="hidden sm:inline">Hardware · </span>
        {arduinoConectado ? "OK" : "Offline"}
      </span>
    </div>
  );
}
