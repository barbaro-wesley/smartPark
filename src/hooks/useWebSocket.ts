"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { WSMessage } from "@/types/parking";

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  url: string;
  onMessage: (msg: WSMessage) => void;
  reconnectDelay?: number; // ms
  maxRetries?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectDelay = 3000,
  maxRetries = 10,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);

  // Mantém referência atualizada sem reiniciar a conexão
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {
        // mensagem malformada — ignorar
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      if (retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(connect, reconnectDelay);
      }
    };
  }, [url, reconnectDelay, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}
