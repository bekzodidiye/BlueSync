import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AudioService, BluetoothService, DeviceInfo } from "./src/server/services.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  app.get("/api/devices", async (req, res) => {
    try {
      const isCloundRun = process.env.K_SERVICE !== undefined || process.env.CLOUD_RUN_JOB !== undefined;
      
      const btDevices = await BluetoothService.getPairedDevices();
      const activeSinks = await AudioService.getActiveSinks();
      const activeSources = await AudioService.getActiveSources();

      if (!btDevices.length && !activeSinks.length && !activeSources.length) {
        return res.json({ 
          devices: [], 
          mode: isCloundRun ? 'cloud-preview' : 'hardware', 
          error: isCloundRun 
            ? "Bluetooth can't be accessed in the Cloud Preview. To control your local Bluetooth devices, download and run this app locally on your Linux machine."
            : "No Bluetooth audio devices or sinks detected on this system." 
        });
      }

      const devices: DeviceInfo[] = [];

      // Add Sinks (Speakers/Headphones)
      btDevices.forEach(dev => {
        const macFormatted = dev.mac.replace(/:/g, '_');
        const sink = activeSinks.find(s => s.name.includes(macFormatted));
        devices.push({
          id: `bt_sink_${dev.mac}`,
          name: dev.name,
          status: sink ? "connected" : "disconnected",
          profile: sink ? "A2DP / High Quality" : "None",
          sink: sink ? sink.name : null,
          active: !!sink,
          type: 'sink',
          volume: 85,
          latency_ms: 0,
          muted: false
        });

        // Add Sources (Microphones)
        const source = activeSources.find(s => s.name.includes(macFormatted));
        if (source) {
          devices.push({
            id: `bt_source_${dev.mac}`,
            name: `${dev.name} (Microphone)`,
            status: "connected",
            profile: "HFP/HSP",
            sink: source.name,
            active: true,
            type: 'source',
            volume: 70,
            latency_ms: 0,
            muted: false
          });
        }
      });

      res.json({ devices, mode: 'hardware' });
    } catch (error: any) {
      res.json({ 
        devices: [],
        mode: 'error',
        error: "System integration error", 
        details: error.message
      });
    }
  });

  app.post("/api/devices/volume", async (req, res) => {
    const { sink, volume } = req.body;
    try {
      await AudioService.setVolume(sink, volume);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to set volume" });
    }
  });

  app.post("/api/devices/mute", async (req, res) => {
    const { sink, muted } = req.body;
    try {
      await AudioService.setMute(sink, muted);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to set mute state" });
    }
  });

  app.post("/api/devices/latency", async (req, res) => {
    const { sink, latency } = req.body;
    try {
      await AudioService.setLatency(sink, latency);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to set latency" });
    }
  });

  app.post("/api/combine", async (req, res) => {
    const { deviceIds } = req.body;
    try {
      const btDevices = await BluetoothService.getPairedDevices();
      const activeSinks = await AudioService.getActiveSinks();
      
      const slaves = btDevices
        .filter(d => deviceIds.includes(`bt_${d.mac}`))
        .map(dev => {
          const macFormatted = dev.mac.replace(/:/g, '_');
          return activeSinks.find(s => s.name.includes(macFormatted))?.name;
        })
        .filter(Boolean) as string[];

      if (slaves.length < 1) {
        return res.status(400).json({ error: "No valid active Bluetooth sinks found for selection." });
      }

      const moduleId = await AudioService.createCombinedSink(slaves);
      res.json({ status: "success", moduleId });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create synchronized output", details: error.message });
    }
  });

  app.post("/api/reset", async (req, res) => {
    try {
      await AudioService.resetRouting();
      res.json({ status: "success" });
    } catch (error) {
      res.json({ status: "success", message: "System reset (simulated)" });
    }
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
    console.log(`BlueSync Manager running on http://localhost:${PORT}`);
  });
}

startServer();
