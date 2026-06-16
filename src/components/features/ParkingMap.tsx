"use client";

import { cn } from "@/lib/utils";
import type { ParkingStatus, VagaId } from "@/types/parking";

interface ParkingMapProps {
  status: ParkingStatus | null;
}

const VAGAS: { id: VagaId; label: string }[] = [
  { id: 1, label: "V1" },
  { id: 2, label: "V2" },
  { id: 3, label: "V3" },
  { id: 4, label: "V4" },
];

export function ParkingMap({ status }: ParkingMapProps) {
  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Mapa de vagas">
      {/* Entrada */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <div className="h-px flex-1 bg-zinc-800" />
        <span>ENTRADA</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Grid das vagas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VAGAS.map(({ id, label }) => {
          const vagaStatus = status?.vagas[id] ?? "livre";
          const ocupada = vagaStatus === "ocupada";

          return (
            <div
              key={id}
              role="status"
              aria-label={`${label}: ${ocupada ? "ocupada" : "livre"}`}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "rounded-xl border-2 h-28 transition-all duration-500 overflow-hidden",
                ocupada
                  ? "border-red-500/60 bg-red-500/10"
                  : "border-emerald-500/60 bg-emerald-500/10"
              )}
            >
              {/* Número da vaga */}
              <span className="text-xs font-mono text-zinc-500 mb-2">{label}</span>

              {/* Ícone de carro ou check */}
              <div
                className={cn(
                  "text-3xl transition-all duration-500",
                  ocupada ? "opacity-100 scale-100" : "opacity-30 scale-90"
                )}
              >
                {ocupada ? "🚗" : "✓"}
              </div>

              {/* Badge status */}
              <span
                className={cn(
                  "mt-2 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full",
                  ocupada
                    ? "text-red-400 bg-red-500/20"
                    : "text-emerald-400 bg-emerald-500/20"
                )}
              >
                {ocupada ? "ocupada" : "livre"}
              </span>

              {/* Linha de cor na base */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 transition-all duration-500",
                  ocupada ? "bg-red-500" : "bg-emerald-500"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Rodapé cancela */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <div className="h-px flex-1 bg-zinc-800" />
        <span>CANCELA</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}
