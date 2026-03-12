import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.post("/api/upload", upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.use('/uploads', express.static(uploadDir));

  app.post("/api/generate-image", async (req, res) => {
    const { prompt, model, aspectRatio, seed } = req.body;
    
    try {
      if (!process.env.VENICE_API_KEY) {
        throw new Error("VENICE_API_KEY is not configured in environment variables.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("https://api.venice.ai/api/v1/image/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VENICE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "flux-2-pro",
          prompt,
          seed: seed || undefined,
          // Venice uses width/height instead of aspect_ratio in some models
          // but we'll stick to their standard for now
          safe_mode: true,
          return_binary: false
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Venice API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      // Venice returns images in an array, usually base64 or URL
      const imageUrl = data.images?.[0] || data.url;

      res.json({ imageUrl, model: model, id: Date.now().toString() });
    } catch (error: any) {
      console.error("Venice generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/edit-image", async (req, res) => {
    const { prompt, image, model, seed } = req.body;
    
    try {
      if (!process.env.VENICE_API_KEY) {
        throw new Error("VENICE_API_KEY is not configured in environment variables.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Venice Edit API
      const response = await fetch("https://api.venice.ai/api/v1/image/edit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VENICE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "flux-2-pro-edit",
          prompt: prompt || " ",
          image: image, // Base64 expected
          seed: seed || undefined,
          safe_mode: true,
          return_binary: false
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Venice API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const imageUrl = data.images?.[0] || data.url;

      res.json({ imageUrl, model: model, id: Date.now().toString() });
    } catch (error: any) {
      console.error("Venice edit error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
