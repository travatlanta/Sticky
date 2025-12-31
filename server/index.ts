import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";
import { autoSeedIfNeeded } from "./auto-seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const NEXT_PORT = 3000;

// Create cart proxy middleware FIRST (before body parsers consume the stream)
// Use a filter function to only proxy /api/cart paths while preserving the full path
const cartProxy = createProxyMiddleware({
  target: `http://localhost:${NEXT_PORT}`,
  changeOrigin: true,
  logLevel: "silent",
});

// Route /api/cart and /api/settings paths to Next.js BEFORE body parsers
// Use router to preserve the full URL path
app.use((req, res, next) => {
  if (req.path.startsWith('/api/cart') || req.path.startsWith('/api/settings') || req.path.startsWith('/api/admin/settings')) {
    return cartProxy(req, res, next);
  }
  next();
});

// Now add body parsers for Express routes
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

async function startNextApp() {
  return new Promise<void>((resolve, reject) => {
    const nextDir = path.resolve(__dirname, "..", "next-app");
    const nextProcess = spawn("npm", ["run", "dev", "--", "-p", String(NEXT_PORT)], {
      cwd: nextDir,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    nextProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      process.stdout.write(`[Next.js] ${output}`);
      if (output.includes("Ready") || output.includes("started server") || output.includes(`localhost:${NEXT_PORT}`)) {
        resolve();
      }
    });

    nextProcess.stderr?.on("data", (data) => {
      process.stderr.write(`[Next.js] ${data}`);
    });

    nextProcess.on("error", reject);
    
    // Give it time to start even if we don't see the ready message
    setTimeout(() => resolve(), 10000);
  });
}

async function main() {
  // Auto-seed production database if it has stale data
  try {
    await autoSeedIfNeeded();
  } catch (err) {
    console.error("Auto-seed failed:", err);
  }

  // Start Next.js dev server
  console.log("Starting Next.js development server...");
  try {
    await startNextApp();
    console.log("Next.js server started on port", NEXT_PORT);
  } catch (err) {
    console.error("Failed to start Next.js:", err);
  }

  // Set up API routes (these run after /api/cart is already handled by proxy)
  const server = await registerRoutes(app);

  // Proxy all other requests to Next.js (after body parsers, with body re-streaming)
  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${NEXT_PORT}`,
      changeOrigin: true,
      ws: true,
      logLevel: "silent",
      onProxyReq: (proxyReq, req: any) => {
        // Re-stream body that was consumed by express.json()
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
    })
  );

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
  });
}

main().catch(console.error);
