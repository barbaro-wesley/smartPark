// ============================================================
// Tipos derivados do protocolo serial e API — CLAUDE.md §6 e §7
// ============================================================

export type VagaId = 1 | 2 | 3 | 4;

export type VagaStatus = "livre" | "ocupada";

export interface Vaga {
  id: VagaId;
  status: VagaStatus;
  label: string; // ex: "Vaga 1"
}

// Payload do status periódico (API /api/status)
export interface ParkingStatus {
  vagas: Record<VagaId, VagaStatus>;
  livre: number;
  ocupado: number;
  fluxo: number;
  total: number; // sempre 4
  porcentagem_ocupacao: number;
  timestamp: string; // ISO
  arduino_conectado: boolean;
}

// Tipos de eventos do protocolo serial EVT:tipo|mensagem
export type EventoTipo =
  | "ocupada"
  | "liberada"
  | "entrada"
  | "saida"
  | "cancela"
  | "lotado"
  | "alerta"
  | "sistema";

export interface Evento {
  id: number;
  timestamp: string; // ISO
  tipo: EventoTipo;
  mensagem: string;
}

// Histórico (tabela `historico` do SQLite)
export interface HistoricoPoint {
  timestamp: string;
  v1: 0 | 1;
  v2: 0 | 1;
  v3: 0 | 1;
  v4: 0 | 1;
  livre: number;
  ocupado: number;
  fluxo: number;
}

// Estatísticas do dia (tabela `estatisticas_diarias`)
export interface EstatisticasDiarias {
  data: string;
  total_entradas: number;
  total_saidas: number;
  pico_ocupacao: number;
  hora_pico: string;
  media_ocupacao: number;
  tempo_medio_min: number;
}

// Alertas do motor de regras — CLAUDE.md §7
export type AlertaTipo =
  | "lotado"
  | "ultima_vaga"
  | "sensor_offline"
  | "arduino_desconectado"
  | "alto_fluxo";

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  mensagem: string;
  timestamp: string;
  ativo: boolean;
}

// Payload completo retornado por GET /api/status
export interface StatusResponse {
  status: ParkingStatus;
  historico: HistoricoPoint[];
  eventos: Evento[];
  alertas: Alerta[];
}

// Payload do WebSocket (push em tempo real)
export type WSMessage =
  | { type: "status"; data: ParkingStatus }
  | { type: "evento"; data: Evento }
  | { type: "alerta"; data: Alerta }
  | { type: "alerta_resolvido"; id: string }
  | { type: "ping" };
