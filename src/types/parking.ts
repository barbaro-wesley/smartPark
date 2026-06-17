export type VagaId = 1 | 2;

export type VagaStatus = "livre" | "ocupada";

export interface Vaga {
  id: VagaId;
  status: VagaStatus;
  label: string;
}

export interface ParkingStatus {
  vagas: Record<VagaId, VagaStatus>;
  livre: number;
  ocupado: number;
  fluxo: number;
  total: number; // sempre 2
  porcentagem_ocupacao: number;
  timestamp: string;
  arduino_conectado: boolean;
}

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
  timestamp: string;
  tipo: EventoTipo;
  mensagem: string;
}

export interface HistoricoPoint {
  timestamp: string;
  v1: 0 | 1;
  v2: 0 | 1;
  v3?: 0 | 1;
  v4?: 0 | 1;
  livre: number;
  ocupado: number;
  fluxo: number;
}

export interface EstatisticasDiarias {
  data: string;
  total_entradas: number;
  total_saidas: number;
  pico_ocupacao: number;
  hora_pico: string;
  media_ocupacao: number;
  tempo_medio_min: number;
}

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

export interface StatusResponse {
  status: ParkingStatus;
  historico: HistoricoPoint[];
  eventos: Evento[];
  alertas: Alerta[];
}

export type WSMessage =
  | { type: "status"; data: ParkingStatus }
  | { type: "evento"; data: Evento }
  | { type: "alerta"; data: Alerta }
  | { type: "alerta_resolvido"; id: string }
  | { type: "ping" };
