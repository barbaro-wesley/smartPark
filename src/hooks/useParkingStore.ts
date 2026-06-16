"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import type {
  Alerta,
  Evento,
  HistoricoPoint,
  ParkingStatus,
  StatusResponse,
  WSMessage,
} from "@/types/parking";

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
export interface ParkingState {
  status: ParkingStatus | null;
  historico: HistoricoPoint[];
  eventos: Evento[];
  alertas: Alerta[];
  loading: boolean;
  error: string | null;
  wsStatus: "connecting" | "connected" | "disconnected" | "error";
}

const initialState: ParkingState = {
  status: null,
  historico: [],
  eventos: [],
  alertas: [],
  loading: true,
  error: null,
  wsStatus: "disconnected",
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
type Action =
  | { type: "LOAD_SUCCESS"; payload: StatusResponse }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "UPDATE_STATUS"; payload: ParkingStatus }
  | { type: "ADD_EVENTO"; payload: Evento }
  | { type: "ADD_ALERTA"; payload: Alerta }
  | { type: "RESOLVE_ALERTA"; id: string }
  | { type: "SET_WS_STATUS"; payload: ParkingState["wsStatus"] };

function reducer(state: ParkingState, action: Action): ParkingState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };

    case "UPDATE_STATUS":
      return { ...state, status: action.payload };

    case "ADD_EVENTO":
      return {
        ...state,
        eventos: [action.payload, ...state.eventos].slice(0, 100),
      };

    case "ADD_ALERTA":
      return {
        ...state,
        alertas: [
          action.payload,
          ...state.alertas.filter((a) => a.id !== action.payload.id),
        ],
      };

    case "RESOLVE_ALERTA":
      return {
        ...state,
        alertas: state.alertas.map((a) =>
          a.id === action.id ? { ...a, ativo: false } : a
        ),
      };

    case "SET_WS_STATUS":
      return { ...state, wsStatus: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

/**
 * Constrói a URL base dinamicamente para funcionar tanto em
 * desenvolvimento (localhost:5173 → backend :5000) quanto em
 * produção (Raspberry Pi servindo tudo na :5000).
 */
function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return "http://localhost:5000";
  return `http://${window.location.hostname}:5000`;
}

function getWsUrl(): string {
  const base = getBaseUrl().replace(/^http/, "ws");
  return `${base}/ws`;
}

export function useParkingStore() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const baseUrl = useRef(getBaseUrl());

  // Carga inicial via REST
  useEffect(() => {
    fetch(`${baseUrl.current}/api/status`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<StatusResponse>;
      })
      .then((data) => dispatch({ type: "LOAD_SUCCESS", payload: data }))
      .catch((e) => dispatch({ type: "LOAD_ERROR", error: String(e) }));
  }, []);

  // Handler de mensagens WebSocket
  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "status":
        dispatch({ type: "UPDATE_STATUS", payload: msg.data });
        break;
      case "evento":
        dispatch({ type: "ADD_EVENTO", payload: msg.data });
        break;
      case "alerta":
        dispatch({ type: "ADD_ALERTA", payload: msg.data });
        break;
      case "alerta_resolvido":
        dispatch({ type: "RESOLVE_ALERTA", id: msg.id });
        break;
    }
  }, []);

  const { status: wsStatus } = useWebSocket({
    url: getWsUrl(),
    onMessage: handleMessage,
  });

  // Propaga status do WS para o estado
  useEffect(() => {
    dispatch({ type: "SET_WS_STATUS", payload: wsStatus });
  }, [wsStatus]);

  return state;
}
