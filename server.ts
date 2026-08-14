import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import authRoutes from "./src/lib/server/authRoutes.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API endpoints
  app.use("/api/auth", authRoutes);
  app.use("/api", authRoutes);
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Enigma Radio Transceiver Server" });
  });

  const server = http.createServer(app);

  // WebSocket Server for Multi-User Radio Simulation
  const wss = new WebSocketServer({ server });

  interface ClientInfo {
    ws: WebSocket;
    id: string;
    callSign: string;
    frequency: string; // e.g. "7.025"
  }

  const clients = new Map<WebSocket, ClientInfo>();

  function broadcastFrequencyPresence(frequency: string) {
    const stationsInFreq = Array.from(clients.values())
      .filter((c) => c.frequency === frequency)
      .map((c) => ({ id: c.id, callSign: c.callSign }));

    const payload = JSON.stringify({
      type: "presence",
      frequency,
      stations: stationsInFreq,
      count: stationsInFreq.length,
    });

    clients.forEach((client, ws) => {
      if (client.frequency === frequency && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  wss.on("connection", (ws) => {
    const clientId = Math.random().toString(36).substring(2, 9);
    clients.set(ws, { ws, id: clientId, callSign: "DFS", frequency: "7.025" });

    // Send connection initialization
    ws.send(JSON.stringify({ type: "connected", clientId }));

    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        const client = clients.get(ws);
        if (!client) return;

        switch (message.type) {
          case "join_frequency": {
            const oldFreq = client.frequency;
            client.frequency = String(message.frequency || "7.025");
            if (message.callSign) {
              client.callSign = String(message.callSign).toUpperCase().substring(0, 5);
            }
            broadcastFrequencyPresence(oldFreq);
            broadcastFrequencyPresence(client.frequency);
            break;
          }

          case "update_callsign": {
            client.callSign = String(message.callSign || "DFS").toUpperCase().substring(0, 5);
            broadcastFrequencyPresence(client.frequency);
            break;
          }

          case "morse_keydown": {
            // Live CW Telegraph Key Down
            const payload = JSON.stringify({
              type: "morse_keydown",
              senderId: client.id,
              callSign: client.callSign,
              frequency: client.frequency,
              timestamp: Date.now(),
              pitch: message.pitch || 700,
            });
            clients.forEach((otherClient, otherWs) => {
              if (
                otherClient.frequency === client.frequency &&
                otherWs !== ws &&
                otherWs.readyState === WebSocket.OPEN
              ) {
                otherWs.send(payload);
              }
            });
            break;
          }

          case "morse_keyup": {
            // Live CW Telegraph Key Up
            const payload = JSON.stringify({
              type: "morse_keyup",
              senderId: client.id,
              callSign: client.callSign,
              frequency: client.frequency,
              timestamp: Date.now(),
              duration: message.duration || 0,
            });
            clients.forEach((otherClient, otherWs) => {
              if (
                otherClient.frequency === client.frequency &&
                otherWs !== ws &&
                otherWs.readyState === WebSocket.OPEN
              ) {
                otherWs.send(payload);
              }
            });
            break;
          }

          case "broadcast_telegram": {
            // High-Speed or Morse Funktelegramm Broadcast
            const payload = JSON.stringify({
              type: "broadcast_telegram",
              senderId: client.id,
              callSign: client.callSign,
              frequency: client.frequency,
              timestamp: Date.now(),
              header: message.header,
              ciphertext: message.ciphertext,
              morseCode: message.morseCode,
              wpm: message.wpm || 18,
            });
            clients.forEach((otherClient, otherWs) => {
              if (
                otherClient.frequency === client.frequency &&
                otherWs.readyState === WebSocket.OPEN
              ) {
                otherWs.send(payload);
              }
            });
            break;
          }

          case "qso_chat": {
            // Q-code / Station Chat Message
            const payload = JSON.stringify({
              type: "qso_chat",
              senderId: client.id,
              callSign: client.callSign,
              frequency: client.frequency,
              timestamp: Date.now(),
              text: message.text,
              morse: message.morse,
            });
            clients.forEach((otherClient, otherWs) => {
              if (
                otherClient.frequency === client.frequency &&
                otherWs.readyState === WebSocket.OPEN
              ) {
                otherWs.send(payload);
              }
            });
            break;
          }

          case "radio_settings_update": {
            const payload = JSON.stringify({
              type: "radio_settings_update",
              senderId: client.id,
              settings: message.settings,
              timestamp: Date.now(),
            });
            clients.forEach((otherClient, otherWs) => {
              if (otherWs !== ws && otherWs.readyState === WebSocket.OPEN) {
                otherWs.send(payload);
              }
            });
            break;
          }
        }
      } catch (e) {
        console.error("Malformed WebSocket message:", e);
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        const freq = client.frequency;
        clients.delete(ws);
        broadcastFrequencyPresence(freq);
      }
    });
  });

  // Serve Vite development app or production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Radio Transceiver Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
