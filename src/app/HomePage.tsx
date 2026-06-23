import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { useParkingContext } from "@/context/ParkingContext";
import { OccupancyChart } from "@/components/features/OccupancyChart";
import { EventLog } from "@/components/features/EventLog";
import { NavLink } from "react-router-dom";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Estatisticas {
  data: string;
  total_entradas: number;
  total_saidas: number;
  pico_ocupacao: number;
  hora_pico: string | null;
  media_ocupacao: number;
  tempo_medio_min: number;
}

interface DiaRelatorio {
  data: string;
  total_entradas: number;
  total_saidas: number;
  pico_ocupacao: number;
  media_ocupacao: number;
  tempo_medio_min: number;
  hora_pico: string | null;
}

interface RelatorioSemana {
  periodo?: string;
  dias?: DiaRelatorio[];
  totais?: {
    entradas: number;
    saidas: number;
    media_ocupacao: number;
  };
}

function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return "http://localhost:5000";
  return `${window.location.protocol}//${window.location.host}`;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        {/* Logo */}
        <div className="admin-logo">
          <div className="admin-logo-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" className="admin-logo-svg" aria-hidden="true">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v1h-.5A1.5 1.5 0 000 7.5v3A1.5 1.5 0 001.5 12H2v.5A1.5 1.5 0 003.5 14H4a2.5 2.5 0 005 0h3a2.5 2.5 0 005 0h.5a1.5 1.5 0 001.5-1.5v-2a1 1 0 00-.293-.707l-2-2A1 1 0 0016 7.5h-1V5a1 1 0 00-1-1H3z" />
            </svg>
          </div>
          <div>
            <h1 className="admin-logo-title">Smart Parking</h1>
            <p className="admin-logo-sub">Smart Campus · ATITUS Educação</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav" aria-label="Navegação principal">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link"
            }
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="admin-nav-icon" aria-hidden="true">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3zM6.5 7a1 1 0 011-1h2a1 1 0 011 1v7a1 1 0 01-1 1h-2a1 1 0 01-1-1V7zM11 4a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Relatórios
          </NavLink>
          <NavLink
            to="/painel"
            className={({ isActive }) =>
              isActive ? "admin-nav-link admin-nav-link--live" : "admin-nav-link"
            }
          >
            <span className="admin-live-dot" aria-hidden="true" />
            Painel ao Vivo
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-top">
        <span className="admin-kpi-label">{label}</span>
        <span className="admin-kpi-icon">{icon}</span>
      </div>
      <div className="admin-kpi-value">{value}</div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="admin-section-title">{children}</h2>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`admin-card ${className}`}>{children}</div>;
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { status, historico, eventos, loading, error } = useParkingContext();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioSemana | null>(null);
  const [exportando, setExportando] = useState(false);
  const relatorioRef = useRef<HTMLDivElement>(null);
  const baseUrl = getBaseUrl();

  useEffect(() => {
    fetch(`${baseUrl}/api/estatisticas`)
      .then((r) => r.json())
      .then(setEstatisticas)
      .catch(() => {});

    fetch(`${baseUrl}/api/relatorio`)
      .then((r) => r.json())
      .then((data) => {
        // A API retorna um array direto; normalizamos para o shape esperado
        if (Array.isArray(data)) {
          const dias: DiaRelatorio[] = data;
          const totais = dias.reduce(
            (acc, d) => ({
              entradas: acc.entradas + d.total_entradas,
              saidas: acc.saidas + d.total_saidas,
              media_ocupacao:
                dias.length > 0
                  ? dias.reduce((s, x) => s + x.media_ocupacao, 0) / dias.length
                  : 0,
            }),
            { entradas: 0, saidas: 0, media_ocupacao: 0 }
          );
          setRelatorio({ dias, totais });
        } else {
          setRelatorio(data);
        }
      })
      .catch(() => {});
  }, [baseUrl]);

  function exportarPDF() {
    setExportando(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("SmartPark — Relatório Administrativo", W / 2, y, { align: "center" });
      y += 8;

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")} · Smart Campus ATITUS`,
        W / 2,
        y,
        { align: "center" }
      );
      y += 10;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, W - 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text("Status Atual", 14, y);
      y += 6;

      doc.setFontSize(9);
      const statusRows = [
        ["Vagas Livres", `${status?.livre ?? "—"} de ${status?.total ?? 2}`],
        ["Vagas Ocupadas", String(status?.ocupado ?? "—")],
        ["Fluxo (entradas)", String(status?.fluxo ?? "—")],
        ["Ocupação", `${Math.round(status?.porcentagem_ocupacao ?? 0)}%`],
      ];
      statusRows.forEach(([label, value]) => {
        doc.setTextColor(100, 116, 139);
        doc.text(label, 16, y);
        doc.setTextColor(51, 65, 85);
        doc.text(value, W - 16, y, { align: "right" });
        y += 5;
      });
      y += 6;

      if (estatisticas) {
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text("Estatísticas do Dia", 14, y);
        y += 6;
        doc.setFontSize(9);
        const estRows = [
          ["Data", estatisticas.data],
          ["Total de Entradas", String(estatisticas.total_entradas)],
          ["Total de Saídas", String(estatisticas.total_saidas)],
          ["Pico de Ocupação", `${estatisticas.pico_ocupacao} vagas`],
          ["Hora do Pico", estatisticas.hora_pico ?? "—"],
          ["Média de Ocupação", `${estatisticas.media_ocupacao.toFixed(1)}%`],
          [
            "Tempo Médio de Permanência",
            estatisticas.tempo_medio_min > 0
              ? `${estatisticas.tempo_medio_min.toFixed(0)} min`
              : "—",
          ],
        ];
        estRows.forEach(([label, value]) => {
          doc.setTextColor(100, 116, 139);
          doc.text(label, 16, y);
          doc.setTextColor(51, 65, 85);
          doc.text(value, W - 16, y, { align: "right" });
          y += 5;
        });
        y += 6;
      }

      if (relatorio?.dias?.length) {
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text("Relatório Semanal", 14, y);
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const cols = ["Data", "Entradas", "Saídas", "Pico", "Média %"];
        const colX = [16, 60, 90, 120, 150];
        cols.forEach((c, i) => doc.text(c, colX[i], y));
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, W - 14, y);
        y += 4;
        relatorio.dias.forEach((dia) => {
          if (y > 260) { doc.addPage(); y = 15; }
          doc.setTextColor(51, 65, 85);
          doc.text(dia.data, colX[0], y);
          doc.text(String(dia.total_entradas), colX[1], y);
          doc.text(String(dia.total_saidas), colX[2], y);
          doc.text(String(dia.pico_ocupacao), colX[3], y);
          doc.text(`${dia.media_ocupacao.toFixed(1)}%`, colX[4], y);
          y += 5;
        });
        if (relatorio.totais) {
          y += 4;
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(9);
          doc.text(
            `Total: ${relatorio.totais.entradas} entradas · ${relatorio.totais.saidas} saídas · Média ${relatorio.totais.media_ocupacao.toFixed(1)}%`,
            14,
            y
          );
          y += 8;
        }
      }

      if (eventos.length > 0) {
        if (y > 220) { doc.addPage(); y = 15; }
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text("Últimos Eventos", 14, y);
        y += 6;
        doc.setFontSize(8);
        eventos.slice(0, 20).forEach((ev) => {
          if (y > 270) { doc.addPage(); y = 15; }
          const hora = new Date(ev.timestamp).toLocaleString("pt-BR");
          doc.setTextColor(100, 116, 139);
          doc.text(hora, 16, y);
          doc.setTextColor(51, 65, 85);
          doc.text(ev.mensagem, 70, y, { maxWidth: W - 85 });
          y += 5;
        });
      }

      doc.save(`smartpark-relatorio-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExportando(false);
    }
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="admin-root">
      <AdminHeader />

      <div className="admin-page-header">
        <div className="admin-page-header-inner">
          <div>
            <h1 className="admin-page-title">Painel Administrativo</h1>
            <p className="admin-page-sub">{hoje}</p>
          </div>
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="admin-btn-export"
            id="btn-exportar-pdf"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a3 3 0 003 3h12a3 3 0 003-3V7a3 3 0 00-3-3H9L3 9v8z" />
            </svg>
            {exportando ? "Gerando…" : "Exportar PDF"}
          </button>
        </div>
      </div>

      <main className="admin-main" ref={relatorioRef}>
        {loading && (
          <div className="admin-loading" role="status" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="admin-skeleton" />
            ))}
            <span className="sr-only">Carregando…</span>
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="admin-error">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Falha na conexão com o backend</p>
              <p className="text-xs mt-0.5 opacity-70 font-mono">{error}</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* KPIs */}
            <section aria-label="Indicadores principais">
              <SectionTitle>Indicadores de Hoje</SectionTitle>
              <div className="admin-kpi-grid">
                <KpiCard
                  label="Vagas Livres"
                  value={status?.livre ?? "—"}
                  sub={`de ${status?.total ?? 2} vagas`}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <KpiCard
                  label="Vagas Ocupadas"
                  value={status?.ocupado ?? "—"}
                  sub={`de ${status?.total ?? 2} vagas`}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3v-3.5l1.5-4h11l1.5 4V17h-2m-5 0H8m8 0a1 1 0 11-2 0 1 1 0 012 0zM7 17a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  }
                />
                <KpiCard
                  label="Total de Entradas"
                  value={estatisticas?.total_entradas ?? status?.fluxo ?? "—"}
                  sub="veículos hoje"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M13 6l6 6-6 6" />
                    </svg>
                  }
                />
                <KpiCard
                  label="Pico de Ocupação"
                  value={estatisticas ? `${estatisticas.pico_ocupacao} vg` : "—"}
                  sub={estatisticas?.hora_pico ? `às ${estatisticas.hora_pico}` : undefined}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  }
                />
                <KpiCard
                  label="Total de Saídas"
                  value={estatisticas?.total_saidas ?? "—"}
                  sub="veículos hoje"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H3m8 6l-6-6 6-6" />
                    </svg>
                  }
                />
                <KpiCard
                  label="Média de Ocupação"
                  value={estatisticas ? `${estatisticas.media_ocupacao.toFixed(1)}%` : "—"}
                  sub="no período"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* Gráfico */}
            <section aria-label="Ocupação histórica">
              <SectionTitle>Ocupação Histórica</SectionTitle>
              <Card>
                <OccupancyChart historico={historico} />
                <p className="admin-chart-caption">
                  Vagas ocupadas por snapshot · últimas leituras registradas
                </p>
              </Card>
            </section>

            {/* Grid inferior */}
            <div className="admin-bottom-grid">
              {/* Relatório semanal */}
              <section aria-label="Relatório semanal">
                <SectionTitle>Relatório Semanal</SectionTitle>
                <Card>
                  {relatorio?.dias?.length ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th className="admin-th text-left">Data</th>
                          <th className="admin-th text-right">Entradas</th>
                          <th className="admin-th text-right">Saídas</th>
                          <th className="admin-th text-right">Pico</th>
                          <th className="admin-th text-right">Média %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.map((dia) => (
                          <tr key={dia.data} className="admin-tr">
                            <td className="admin-td font-medium text-slate-700">{dia.data}</td>
                            <td className="admin-td text-right">{dia.total_entradas}</td>
                            <td className="admin-td text-right">{dia.total_saidas}</td>
                            <td className="admin-td text-right">{dia.pico_ocupacao}</td>
                            <td className="admin-td text-right">{dia.media_ocupacao.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      {relatorio.totais && (
                        <tfoot>
                          <tr className="admin-tfoot-row">
                            <td className="admin-td font-semibold text-slate-800">Total</td>
                            <td className="admin-td text-right font-semibold text-slate-800">{relatorio.totais.entradas}</td>
                            <td className="admin-td text-right font-semibold text-slate-800">{relatorio.totais.saidas}</td>
                            <td className="admin-td" />
                            <td className="admin-td text-right font-semibold text-slate-800">{relatorio.totais.media_ocupacao.toFixed(1)}%</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  ) : (
                    <p className="admin-empty">Sem dados semanais disponíveis.</p>
                  )}
                </Card>
              </section>

              {/* Log de eventos */}
              <section aria-label="Log de eventos">
                <SectionTitle>Log de Eventos</SectionTitle>
                <Card className="admin-card--events">
                  <EventLog eventos={eventos} />
                </Card>
              </section>
            </div>

            <footer className="admin-footer">
              Hardware Architecture · ATITUS Educação · Profa. Dra. Thaísa Leal da Silva
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
