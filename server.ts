import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { createPriceEngine } from "./src/mocks/priceEngine";
import type { ServerToClientEvents, ClientToServerEvents } from "./src/types/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : undefined,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Initialize the mock price engine
  const priceEngine = createPriceEngine();

  // Namespace for market data
  const marketNs = io.of("/market");

  marketNs.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send initial snapshot of all symbols
    socket.emit("snapshot", priceEngine.getSnapshot());

    // Send available symbols list
    socket.emit("symbols", priceEngine.getSymbols());

    // Handle symbol subscription
    socket.on("subscribe", (symbols: string[]) => {
      symbols.forEach((s) => socket.join(s));
      console.log(`[Socket.io] ${socket.id} subscribed to: ${symbols.join(", ")}`);
    });

    socket.on("unsubscribe", (symbols: string[]) => {
      symbols.forEach((s) => socket.leave(s));
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  // Start the price engine tick loop
  const TICK_INTERVAL_MS = 100; // 10 ticks per second
  setInterval(() => {
    const ticks = priceEngine.tick();
    ticks.forEach((tick) => {
      // Broadcast to subscribers of this symbol AND to the general room
      marketNs.to(tick.symbol).emit("tick", tick);
      marketNs.emit("tick", tick);
    });
  }, TICK_INTERVAL_MS);

  httpServer.listen(port, () => {
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║         Market Pulse PWA - Server Ready          ║
  ╠══════════════════════════════════════════════════╣
  ║  ▸ HTTP:      http://${hostname}:${port}              ║
  ║  ▸ Socket.io: ws://${hostname}:${port}/market         ║
  ║  ▸ Mode:      ${dev ? "development" : "production "}                        ║
  ╚══════════════════════════════════════════════════╝
    `);
  });
});
