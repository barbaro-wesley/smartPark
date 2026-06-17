import type {
  Alerta,
  Evento,
  HistoricoPoint,
  ParkingStatus,
  StatusResponse,
  WSMessage,
} from "@/types/parking";

export const mockStatus: ParkingStatus = {
  vagas: { 1: "livre", 2: "ocupada" },
  livre: 1,
  ocupado: 1,
  fluxo: 7,
  total: 2,
  porcentagem_ocupacao: 50,
  timestamp: new Date().toISOString(),
  arduino_conectado: true,
};

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

export const mockHistorico: HistoricoPoint[] = Array.from(
  { length: 24 },
  (_, i) => {
    const hora = new Date(Date.now() - (23 - i) * 30 * 60_000);
    const ocupado = Math.floor(Math.random() * 3); // 0–2
    return {
      timestamp: hora.toISOString(),
      v1: Math.random() > 0.5 ? 1 : 0,
      v2: Math.random() > 0.5 ? 1 : 0,
      livre: 2 - ocupado,
      ocupado,
      fluxo: Math.floor(Math.random() * 10),
    };
  }
);

export const mockAlertas: Alerta[] = [
  {
    id: "a1",
    tipo: "ultima_vaga",
    mensagem: "Atenção: apenas 1 vaga disponível",
    timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    ativo: false,
  },
];

export const mockStatusResponse: StatusResponse = {
  status: mockStatus,
  historico: mockHistorico,
  eventos: mockEventos,
  alertas: mockAlertas,
};

const mockSequence: WSMessage[] = [
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "livre", 2: "ocupada" },
      livre: 1,
      ocupado: 1,
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
      vagas: { 1: "ocupada", 2: "ocupada" },
      livre: 0,
      ocupado: 2,
      porcentagem_ocupacao: 100,
      fluxo: 8,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "alerta",
    data: {
      id: "a2",
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
      vagas: { 1: "livre", 2: "ocupada" },
      livre: 1,
      ocupado: 1,
      porcentagem_ocupacao: 50,
      fluxo: 9,
      timestamp: new Date().toISOString(),
    },
  },
  {
    type: "alerta_resolvido",
    id: "a2",
  },
  {
    type: "status",
    data: {
      ...mockStatus,
      vagas: { 1: "livre", 2: "livre" },
      livre: 2,
      ocupado: 0,
      porcentagem_ocupacao: 0,
      fluxo: 9,
      timestamp: new Date().toISOString(),
    },
  },
];

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
