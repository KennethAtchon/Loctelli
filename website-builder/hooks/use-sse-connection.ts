import { useEffect, useRef, useState } from "react";

export type SSEEvent = {
  event: string;
  data: any;
};

export function useSSEConnection({
  url,
  onEvent,
  autoReconnect = true,
  reconnectDelay = 3000,
}: {
  url: string;
  onEvent: (event: SSEEvent) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}) {
  const [status, setStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let stopped = false;
    function connect() {
      if (stopped) return;
      setStatus("connecting");
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => setStatus("open");
      es.onerror = () => {
        setStatus("error");
        es.close();
        if (autoReconnect && !stopped) {
          reconnectTimeout.current = setTimeout(connect, reconnectDelay);
        }
      };
      es.onmessage = (e) => {
        // Default event
        try {
          onEvent({ event: "message", data: JSON.parse(e.data) });
        } catch {
          onEvent({ event: "message", data: e.data });
        }
      };
      // Custom event listeners
      ["notification", "job_update", "error"].forEach((evt) => {
        es.addEventListener(evt, (e: MessageEvent) => {
          try {
            onEvent({ event: evt, data: JSON.parse(e.data) });
          } catch {
            onEvent({ event: evt, data: e.data });
          }
        });
      });
    }
    connect();
    return () => {
      stopped = true;
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [url, autoReconnect, reconnectDelay, onEvent]);

  return { status };
} 