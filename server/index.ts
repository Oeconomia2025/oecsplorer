// ============================================================
// Oeconomia Explorer — Server Entry Point
// ============================================================
// Express server with:
// - REST API for explorer data
// - WebSocket for live transaction feed
// - Alchemy webhook receiver
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import apiRoutes from "./routes/api";
import webhookRoutes, { setWebSocketBroadcast } from "./routes/webhooks";
import { startIndexer, setIndexerBroadcast } from "./services/indexer";

const app = express();
const httpServer = createServer(app);

// -- Configuration ----------------------------------------------------------

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = CLIENT_URL.split(",").map((s) => s.trim());

// -- Middleware --------------------------------------------------------------

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "10mb" })); // Alchemy webhooks can be large

// Request logging
app.use((req, _res, next) => {
  if (req.path !== "/api/webhooks/health") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// -- WebSocket Setup --------------------------------------------------------

const io = new SocketIOServer(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Allow clients to subscribe to specific protocol feeds
  socket.on("subscribe_protocol", (protocolId: string) => {
    socket.join(`protocol:${protocolId}`);
    console.log(`[WS] ${socket.id} subscribed to ${protocolId}`);
  });

  socket.on("unsubscribe_protocol", (protocolId: string) => {
    socket.leave(`protocol:${protocolId}`);
  });

  // Subscribe to all transactions
  socket.on("subscribe_all", () => {
    socket.join("all_transactions");
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Wire up the webhook handler to broadcast via WebSocket
setWebSocketBroadcast((event: string, data: unknown) => {
  // Broadcast to "all" subscribers
  io.to("all_transactions").emit(event, data);

  // Broadcast to protocol-specific room
  const txData = data as { protocol?: string };
  if (txData.protocol) {
    io.to(`protocol:${txData.protocol}`).emit(event, data);
  }
});

// -- Routes -----------------------------------------------------------------

app.use("/api", apiRoutes);
app.use("/api/webhooks", webhookRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    wsClients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// -- Static File Serving (production) ---------------------------------------
// In production on Railway, Express serves the Vite-built frontend.
// In development, Vite dev server handles this via proxy.

const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path === "/health") {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) next(); // If dist/index.html doesn't exist (dev mode), skip
  });
});

// -- Start Server -----------------------------------------------------------

// Wire the indexer to the same WebSocket broadcast
setIndexerBroadcast((event: string, data: unknown) => {
  io.to("all_transactions").emit(event, data);
  const txData = data as { protocol?: string };
  if (txData.protocol) {
    io.to(`protocol:${txData.protocol}`).emit(event, data);
  }
});

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║       OECONOMIA EXPLORER — SERVER            ║
  ╠══════════════════════════════════════════════╣
  ║  REST API:    http://localhost:${PORT}/api     ║
  ║  WebSocket:   ws://localhost:${PORT}           ║
  ║  Webhooks:    http://localhost:${PORT}/api/webhooks/alchemy  ║
  ║  Health:      http://localhost:${PORT}/health   ║
  ║  Indexer:     getLogs every 30s                ║
  ╚══════════════════════════════════════════════╝
  `);

  // Start the polling indexer after server is up
  startIndexer().catch((err) => {
    console.error("[Server] Failed to start indexer:", err);
  });
});

export default app;
