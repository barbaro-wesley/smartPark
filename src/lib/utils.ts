import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EventoTipo } from "@/types/parking";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function eventoIcon(tipo: EventoTipo): string {
  const icons: Record<EventoTipo, string> = {
    ocupada: "🚗",
    liberada: "✅",
    entrada: "🔼",
    saida: "🔽",
    cancela: "🚧",
    lotado: "🔴",
    alerta: "⚠️",
    sistema: "⚙️",
  };
  return icons[tipo] ?? "•";
}

export function eventoColor(tipo: EventoTipo): string {
  const colors: Record<EventoTipo, string> = {
    ocupada: "text-red-400",
    liberada: "text-emerald-400",
    entrada: "text-sky-400",
    saida: "text-violet-400",
    cancela: "text-amber-400",
    lotado: "text-red-500",
    alerta: "text-orange-400",
    sistema: "text-zinc-400",
  };
  return colors[tipo] ?? "text-zinc-400";
}
