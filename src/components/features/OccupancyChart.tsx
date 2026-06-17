"use client";

import { useEffect, useRef } from "react";
import type { HistoricoPoint } from "@/types/parking";

interface OccupancyChartProps {
  historico: HistoricoPoint[];
}

/**
 * Gráfico de barras de ocupação por hora — canvas puro, sem dependências.
 * Renderiza as últimas N leituras do histórico (tabela `historico` SQLite).
 */
export function OccupancyChart({ historico }: OccupancyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    if (!historico.length) {
      ctx.fillStyle = "#52525b";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Aguardando dados do histórico…", W / 2, H / 2);
      return;
    }

    const PADDING = { top: 20, bottom: 36, left: 36, right: 12 };
    const chartW = W - PADDING.left - PADDING.right;
    const chartH = H - PADDING.top - PADDING.bottom;

    // Máximo = 2 vagas
    const MAX_VAL = 2;

    const BAR_GAP = 2;
    const barW = Math.max(4, chartW / historico.length - BAR_GAP);

    // Grade horizontal
    for (let v = 0; v <= MAX_VAL; v++) {
      const y = PADDING.top + chartH - (v / MAX_VAL) * chartH;
      ctx.beginPath();
      ctx.strokeStyle = v === 0 ? "#3f3f46" : "#27272a";
      ctx.lineWidth = 1;
      ctx.setLineDash(v > 0 ? [4, 4] : []);
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(W - PADDING.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#52525b";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(v), PADDING.left - 4, y + 3);
    }

    // Barras
    historico.forEach((point, i) => {
      const x = PADDING.left + i * (barW + BAR_GAP);
      const pct = point.ocupado / MAX_VAL;
      const barH = pct * chartH;
      const y = PADDING.top + chartH - barH;

      // Cor por ocupação
      const color =
        pct >= 1
          ? "#ef4444"
          : pct >= 0.75
          ? "#f59e0b"
          : pct >= 0.5
          ? "#3b82f6"
          : "#10b981";

      ctx.fillStyle = color + "99"; // 60% opacidade
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, 2); // topo destacado
    });

    // Labels de hora (a cada ~4 pontos)
    const step = Math.max(1, Math.floor(historico.length / 6));
    historico.forEach((point, i) => {
      if (i % step !== 0) return;
      const x = PADDING.left + i * (barW + BAR_GAP) + barW / 2;
      const label = new Date(point.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      ctx.fillStyle = "#52525b";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, H - 8);
    });
  }, [historico]);

  return (
    <div className="w-full h-40 relative" role="img" aria-label="Gráfico de ocupação histórica">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
