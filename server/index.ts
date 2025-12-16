import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { autoSeedIfNeeded } from "./auto-seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

async function main() {
  // Auto-seed production database if it has stale data
  try {
    await autoSeedIfNeeded();
  } catch (err) {
    console.error("Auto-seed failed:", err);
  }
  
  const server = await registerRoutes(app);

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
  });
}

main().catch(console.error);
