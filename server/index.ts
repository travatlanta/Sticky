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

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

const NEXT_PORT = 3000;

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

  // Set up API routes first
  const server = await registerRoutes(app);

  // Proxy all non-API requests to Next.js
  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${NEXT_PORT}`,
      changeOrigin: true,
      ws: true,
      logLevel: "silent",
    })
  );

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
  });
}

main().catch(console.error);
