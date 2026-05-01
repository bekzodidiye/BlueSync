import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  // Bluetooth boshqaruvi endi brauzer tomonida (Web Bluetooth API) amalga oshiriladi
  // Server faqat statik fayllarni xizmat qiladi

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "web-bluetooth" });
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
