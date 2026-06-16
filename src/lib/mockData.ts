/**
 * Mock de dados para desenvolvimento sem Arduino/Raspberry Pi.
 * Simula o protocolo serial e os endpoints da API conforme CLAUDE.md §6 e §7.
 *
 * Para usar: importe `mockStatusResponse` onde precisar de dados estáticos,
 * ou use `startMockWebSocket` para simular atualizações em tempo real.
 */

import type {
  Alerta,
  Evento,
  HistoricoPoint,
  ParkingStatus,
  StatusResponse,
  WSMessage,
} from "@/types/parking";

// ---------------------------------------------------------------------------
// Status inicial
// ---------------------------------------------------------------------------
export const mockStatus: ParkingStatus = {
  vagas: { 1: "livre", 2: "ocupada", 3: "ocupada", 4: "livre" },
  livre: 2,
  ocupado: 2,
  fluxo: 7,
  total: 4,
  porcentagem_ocupacao: 50,
  timestamp: new Date().toISOString(),
  arduino_conectado: true,
};

// ---------------------------------------------------------------------------
// Eventos recentes
// ---------------------------------------------------------------------------
export const mockEventos: Evento[] = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
    tipo: "ocupada",
    mensagem: "Vaga 2 ocupada",
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
    tipo: "entrada",
    mensagem: "Carro detectado na entrada",
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 13 * 60_000).toISOString(),
    tipo: "cancela",
    mensagem: "Cancela aberta",
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 25 * 60_000).toISOString(),
    tipo: "liberada",
    mensagem: "Vaga 1 liberada",
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 40 * 60_000).toISOString(),
    tipo: "saida",
    mensagem: "Carro saiu",
  },
  {
    id: 6,
    timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
    tipo: "sistema",
    mensagem: "SISTEMA:OK — Arduino conectado",
  },
];

// ---------------------------------------------------------------------------
// Histórico das últimas 12 horas (mock)
// ---------------------------------------------------------------------------
export const mockHistorico: HistoricoPoint[] = Array.from(
  { length: 24 },
  (_, i) => {
    const hora = new Date(Date.now() - (23 - i) * 30 * 60_000);
    const ocupado = Math.floor(Math.random() * 5); // 0–4
    return {
      timestamp: hora.toISOString(),
      v1: Math.random() > 0.5 ? 1 : 0,
      v2: Math.random() > 0.5 ? 1 : 0,
      v3: Math.random() > 0.5 ? 1 : 0,
      v4: Math.random() > 0.5 ? 1 : 0,
      livre: 4 - ocupado,
      ocupado,
      fluxo: Math.floor(Math.random() * 15),
    };
  }
);

// ---------------------------------------------------------------------------
// Alertas ativos
// ---------------------------------------------------------------------------
export const mockAlertas: Alerta[] = [
  {
    id: "a1",
    tipo: "ultima_vaga",
    mensagem: "Atenção: apenas 1 vaga disponível",
    timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    ativo: false,
  },
];

// ---------------------------------------------------------------------------
// Resposta completa de GET /api/status
// ---------------------------------------------------------------------------
export const mockStatusResponse: StatusResponse = {
  status: mockStatus,
  historico: mockHistorico,
  eventos: mockEventos,
  alertas: mockAlertas,
};

// ---------------------------------------------------------------------------
// Simulador de WebSocket — sequência de mensagens realistas
// ---------------------------------------------------------------------------
const mockSequence: WSMessage[] = [
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "livre", 2: "ocupada", 3: "ocupada", 4: "livre" },
      livre: 2,
      ocupado: 2,
      porcentagem_ocupacao: 50,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "evento",
    data: {
      id: 99,
      timestamp: new Date().toISOString(),
      tipo: "entrada",
      mensagem: "Carro detectado na entrada",
    },
  },
  {
    type: "evento",
    data: {
      id: 100,
      timestamp: new Date().toISOString(),
      tipo: "cancela",
      mensagem: "Cancela aberta",
    },
  },
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "ocupada", 2: "ocupada", 3: "ocupada", 4: "livre" },
      livre: 1,
      ocupado: 3,
      porcentagem_ocupacao: 75,
      fluxo: 8,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "alerta",
    data: {
      id: "a2",
      tipo: "ultima_vaga",
      mensagem: "Atenção: apenas 1 vaga disponível",
      timestamp: new Date().toISOString(),
      ativo: true,
    },
  },
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "ocupada", 2: "ocupada", 3: "ocupada", 4: "ocupada" },
      livre: 0,
      ocupado: 4,
      porcentagem_ocupacao: 100,
      fluxo: 9,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "alerta",
    data: {
      id: "a3",
      tipo: "lotado",
      mensagem: "Estacionamento lotado",
      timestamp: new Date().toISOString(),
      ativo: true,
    },
  },
  {
    type: "evento",
    data: {
      id: 101,
      timestamp: new Date().toISOString(),
      tipo: "saida",
      mensagem: "Carro saiu",
    },
  },
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "livre", 2: "ocupada", 3: "ocupada", 4: "ocupada" },
      livre: 1,
      ocupado: 3,
      porcentagem_ocupacao: 75,
      fluxo: 9,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "alerta_resolvido",
    id: "a3",
  },
];

/**
 * Simula um WebSocket disparando mensagens a cada `intervalMs`.
 * Retorna um cleanup function.
 */
export function startMockWebSocket(
  onMessage: (msg: WSMessage) => void,
  intervalMs = 2500
): () => void {
  let i = 0;
  const id = setInterval(() => {
    onMessage(mockSequence[i % mockSequence.length]);
    i++;
  }, intervalMs);
  return () => clearInterval(id);
}
