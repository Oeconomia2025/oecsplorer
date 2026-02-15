// ============================================================
// Oeconomia Explorer — WebSocket Hook
// ============================================================
// React hook for real-time transaction updates from the server.
// Supports subscribing to all transactions or specific protocols.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

export interface LiveTransaction {
  hash: string;
  protocol: string;
  action: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  /** Subscribe to a specific protocol feed (or "all") */
  channel?: string;
  /** Max transactions to keep in memory */
  maxItems?: number;
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { channel = "all", maxItems = 100, autoConnect = true } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Connect
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);

      // Subscribe to the requested channel
      if (channel === "all") {
        socket.emit("subscribe_all");
      } else {
        socket.emit("subscribe_protocol", channel);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    // Listen for new transactions
    socket.on("new_transaction", (data: { summary: LiveTransaction }) => {
      setTransactions((prev) => {
        const updated = [data.summary, ...prev];
        return updated.slice(0, maxItems); // Keep bounded
      });
    });

    socketRef.current = socket;
  }, [channel, maxItems]);

  // Disconnect
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  // Switch channel
  const switchChannel = useCallback(
    (newChannel: string) => {
      const socket = socketRef.current;
      if (!socket) return;

      // Unsubscribe from current
      if (channel === "all") {
        // Can't easily unsubscribe from "all" room, but new subscription overrides
      } else {
        socket.emit("unsubscribe_protocol", channel);
      }

      // Subscribe to new
      if (newChannel === "all") {
        socket.emit("subscribe_all");
      } else {
        socket.emit("subscribe_protocol", newChannel);
      }
    },
    [channel]
  );

  // Clear transaction buffer
  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    transactions,
    error,
    connect,
    disconnect,
    switchChannel,
    clearTransactions,
  };
}
