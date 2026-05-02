import express from "express";
import path from "path";
import os from "os";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { BluetoothService, AudioService } from "./src/server/services";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors()); // Barcha qurilmalardan so'rovlarni qabul qilish
  app.use(express.json());

  // ============= BLUETOOTH API =============

  // Bluetooth scan qilish (5 soniya davomida)
  app.get("/api/bt/scan", async (req, res) => {
    try {
      const devices = await BluetoothService.scanDevices();
      res.json({ success: true, devices });
    } catch (e: any) {
      res.json({ success: false, error: e.message, devices: [] });
    }
  });

  // Juftlangan qurilmalar ro'yxati
  app.get("/api/bt/paired", async (req, res) => {
    try {
      const devices = await BluetoothService.getPairedDevices();
      res.json({ success: true, devices });
    } catch (e: any) {
      res.json({ success: false, error: e.message, devices: [] });
    }
  });

  // Qurilmani juftlash (pair)
  app.post("/api/bt/pair", async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ success: false, error: "MAC manzili kerak" });
    try {
      const result = await BluetoothService.pairDevice(mac);
      res.json({ success: true, result });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Qurilmaga ulanish (connect)
  app.post("/api/bt/connect", async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ success: false, error: "MAC manzili kerak" });
    try {
      const result = await BluetoothService.connectDevice(mac);
      res.json({ success: true, result });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Qurilmani uzish (disconnect)
  app.post("/api/bt/disconnect", async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ success: false, error: "MAC manzili kerak" });
    try {
      const result = await BluetoothService.disconnectDevice(mac);
      res.json({ success: true, result });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Qurilmani o'chirish (remove)
  app.post("/api/bt/remove", async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ success: false, error: "MAC manzili kerak" });
    try {
      const result = await BluetoothService.removeDevice(mac);
      res.json({ success: true, result });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // ============= AUDIO API =============

  // Barcha audio qurilmalar (sinks + sources) ni olish
  app.get("/api/audio/devices", async (req, res) => {
    try {
      const sinks = await AudioService.getActiveSinks();
      const sources = await AudioService.getActiveSources();
      const defaultSink = await AudioService.getDefaultSink();
      res.json({ success: true, sinks, sources, defaultSink });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Ovoz balandligini o'rnatish
  app.post("/api/audio/volume", async (req, res) => {
    const { sinkName, volume } = req.body;
    try {
      await AudioService.setVolume(sinkName, volume);
      res.json({ success: true });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Mute qilish
  app.post("/api/audio/mute", async (req, res) => {
    const { sinkName, muted } = req.body;
    try {
      await AudioService.setMute(sinkName, muted);
      res.json({ success: true });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Combined sink yaratish
  app.post("/api/audio/combine", async (req, res) => {
    const { sinks } = req.body;
    try {
      const moduleId = await AudioService.createCombinedSink(sinks);
      res.json({ success: true, moduleId });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Reset routing
  app.post("/api/audio/reset", async (req, res) => {
    try {
      await AudioService.resetRouting();
      res.json({ success: true });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Latency sozlash
  app.post("/api/audio/latency", async (req, res) => {
    const { sinkName, latency } = req.body;
    try {
      await AudioService.setLatency(sinkName, latency);
      res.json({ success: true });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // To'liq holat (full status) — frontend uchun bir marta chaqirib hammani olish
  app.get("/api/status", async (req, res) => {
    try {
      const paired = await BluetoothService.getPairedDevices();
      const sinks = await AudioService.getActiveSinks();
      const sources = await AudioService.getActiveSources();
      const defaultSink = await AudioService.getDefaultSink();

      // Bluetooth qurilmalarni audio sink-lar bilan moslashtirish
      const devices = paired.map((bt) => {
        const matchingSink = sinks.find(s => 
          s.name.toLowerCase().includes('bluez') && 
          s.name.toLowerCase().includes(bt.mac.replace(/:/g, '_').toLowerCase())
        );
        const matchingSource = sources.find(s => 
          s.name.toLowerCase().includes('bluez') && 
          s.name.toLowerCase().includes(bt.mac.replace(/:/g, '_').toLowerCase())
        );
        
        return {
          id: bt.mac,
          name: bt.name,
          mac: bt.mac,
          status: matchingSink || matchingSource ? 'connected' as const : 'disconnected' as const,
          profile: matchingSink ? 'A2DP Sink' : matchingSource ? 'HFP Source' : 'Unknown',
          sink: matchingSink?.name || null,
          source: matchingSource?.name || null,
          active: matchingSink?.name === defaultSink,
          type: (matchingSource ? 'source' : 'sink') as 'sink' | 'source',
          volume: 85,
          latency_ms: 0,
          muted: false,
        };
      });

      res.json({
        success: true,
        devices,
        audio: { defaultSink, sinks, sources },
      });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "server-bluetooth" });
  });

  // --- Vite Middleware ---
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

  app.listen(PORT, "0.0.0.0", () => {
    // Tarmoqdagi IP manzilini aniqlash
    const interfaces = os.networkInterfaces();
    let networkIp = "localhost";
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === "IPv4" && !iface.internal) {
          networkIp = iface.address;
        }
      }
    }

    console.log(`\n🚀 BlueSync Manager ishga tushdi!`);
    console.log(`-------------------------------------------`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://${networkIp}:${PORT}  <-- Telefoningizdan shu manzilga kiring!`);
    console.log(`-------------------------------------------`);
    console.log(`Rejim:   Server-side Bluetooth (Multi-device enabled)\n`);
  });
}

startServer();
