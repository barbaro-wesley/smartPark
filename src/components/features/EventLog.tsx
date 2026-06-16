"use client";

import { useRef, useEffect } from "react";
import { eventoIcon, eventoColor, formatTime } from "@/lib/utils";
import type { Evento } from "@/types/parking";

interface EventLogProps {
  eventos: Evento[];
}

export function EventLog({ eventos }: EventLogProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Auto-scroll para o topo quando chega novo evento
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [eventos.length]);

  return (
    <div
      className="flex flex-col gap-2"
      role="region"
      aria-label="Log de eventos"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      <ul
        ref={listRef}
        className="flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700 pr-1"
      >
        {eventos.length === 0 && (
          <li className="text-xs text-zinc-600 font-mono py-4 text-center">
            Aguardando eventos…
          </li>
        )}
        {eventos.map((evt) => (
          <li
            key={evt.id}
            className="flex items-start gap-2 text-xs font-mono py-1.5 border-b border-zinc-800/60 last:border-0"
          >
            <span className="shrink-0 mt-px" aria-hidden="true">
              {eventoIcon(evt.tipo)}
            </span>
            <span className={eventoColor(evt.tipo) + " flex-1 leading-snug"}>
              {evt.mensagem}
            </span>
            <span className="text-zinc-600 shrink-0 tabular-nums">
              {formatTime(evt.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
