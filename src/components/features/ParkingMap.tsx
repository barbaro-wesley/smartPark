"use client";

import { cn } from "@/lib/utils";
import type { ParkingStatus, VagaId } from "@/types/parking";

interface ParkingMapProps {
  status: ParkingStatus | null;
}

const VAGAS: { id: VagaId; label: string; name: string }[] = [
  { id: 1, label: "V1", name: "Vaga 1" },
  { id: 2, label: "V2", name: "Vaga 2" },
];

function CarTopDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 120"
      className={className}
      aria-hidden="true"
    >
      {/* Main body */}
      <rect x="12" y="16" width="56" height="88" rx="12" fill="currentColor" />
      {/* Front windshield */}
      <rect x="20" y="30" width="40" height="20" rx="5" fill="rgba(0,0,0,0.45)" />
      {/* Roof panel */}
      <rect x="16" y="50" width="48" height="20" rx="3" fill="rgba(0,0,0,0.12)" />
      {/* Rear windshield */}
      <rect x="20" y="70" width="40" height="18" rx="5" fill="rgba(0,0,0,0.45)" />
      {/* Left front wheel */}
      <rect x="0" y="24" width="12" height="22" rx="6" fill="currentColor" />
      {/* Left rear wheel */}
      <rect x="0" y="74" width="12" height="22" rx="6" fill="currentColor" />
      {/* Right front wheel */}
      <rect x="68" y="24" width="12" height="22" rx="6" fill="currentColor" />
      {/* Right rear wheel */}
      <rect x="68" y="74" width="12" height="22" rx="6" fill="currentColor" />
    </svg>
  );
}

export function ParkingMap({ status }: ParkingMapProps) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
      role="region"
      aria-label="Mapa de vagas do estacionamento"
    >
      {/* Entrada */}
      <div className="flex items-center gap-3 px-5 py-3 bg-emerald-950/60 border-b border-emerald-900/40">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.15em]">
            Entrada
          </span>
        </div>
        <div className="flex-1 flex gap-1 justify-end">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-3 h-0.5 bg-emerald-500/25 rounded" />
          ))}
        </div>
      </div>

      {/* Área de vagas */}
      <div className="p-4 bg-zinc-950/50">
        {/* Linha da via de acesso */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute inset-x-0 border-t-2 border-dashed border-zinc-700/50" />
          <span className="relative bg-zinc-950 px-3 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
            via de acesso
          </span>
        </div>

        {/* Grid 2 vagas grandes */}
        <div className="grid grid-cols-2 gap-3">
          {VAGAS.map(({ id, label, name }) => {
            const vagaStatus = status?.vagas[id] ?? "livre";
            const ocupada = vagaStatus === "ocupada";

            return (
              <div
                key={id}
                role="status"
                aria-label={`${name}: ${ocupada ? "ocupada" : "livre"}`}
                className={cn(
                  "relative flex flex-col items-center justify-between",
                  "rounded-xl h-52 py-4 px-3 overflow-hidden",
                  "border-2 transition-all duration-500",
                  ocupada
                    ? [
                        "border-red-500/50",
                        "bg-gradient-to-b from-red-950/70 to-red-950/40",
                        "shadow-[inset_0_0_40px_rgba(239,68,68,0.12)]",
                      ]
                    : [
                        "border-dashed border-zinc-700/40",
                        "bg-gradient-to-b from-zinc-900/60 to-zinc-950/60",
                      ]
                )}
              >
                {/* Faixa de cor no topo */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1 transition-all duration-500",
                    ocupada ? "bg-red-500" : "bg-zinc-700/40"
                  )}
                />

                {/* Número da vaga */}
                <div className="flex items-center gap-2 z-10">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold tracking-widest uppercase",
                      ocupada ? "text-red-400/80" : "text-zinc-500"
                    )}
                  >
                    {label}
                  </span>
                </div>

                {/* Carro SVG ou "P" */}
                <div
                  className={cn(
                    "flex items-center justify-center flex-1 w-full transition-all duration-700",
                    ocupada
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-[0.07] scale-90"
                  )}
                >
                  {ocupada ? (
                    <CarTopDown
                      className={cn(
                        "w-16 h-24 transition-colors duration-500 text-red-400"
                      )}
                    />
                  ) : (
                    <span className="text-[80px] font-black text-zinc-600 leading-none select-none">
                      P
                    </span>
                  )}
                </div>

                {/* Badge de status */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full z-10 transition-all duration-500",
                    ocupada
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-emerald-500/10 border border-emerald-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      ocupada ? "bg-red-400" : "bg-emerald-400 animate-pulse"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest uppercase",
                      ocupada ? "text-red-300" : "text-emerald-400"
                    )}
                  >
                    {ocupada ? "Ocupada" : "Livre"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Linha inferior */}
        <div className="relative flex items-center justify-center mt-4">
          <div className="absolute inset-x-0 border-t-2 border-dashed border-zinc-700/50" />
        </div>
      </div>

      {/* Cancela / Saída */}
      <div className="flex items-center gap-3 px-5 py-3 bg-zinc-800/40 border-t border-zinc-700/30">
        <div className="flex gap-1 items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-3 h-0.5 bg-zinc-600/30 rounded" />
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.15em]">
            Cancela / Saída
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </div>
    </div>
  );
}
