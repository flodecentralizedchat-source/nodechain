import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { watchProjectWallet } from "./services/walletService.js";
import { startAllJobs } from "./jobs/cronJobs.js";
import { getETHPrice } from "./services/priceService.js";

// ─── Routes ───────────────────────────────────────────────────────────────────
import walletRouter   from "./routes/wallet.js";
import incomeRouter   from "./routes/income.js";
import exchangeRouter from "./routes/exchange.js";
import miningRouter   from "./routes/mining.js";

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173", // Vite dev
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("dev"));
app.use(express.json());

// Rate limiting
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), version: "1.0.0" });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/wallet",   walletRouter);
app.use("/api/income",   incomeRouter);
app.use("/api/exchange", exchangeRouter);
app.use("/api/mining",   miningRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  console.log("\n🚀 NodeChain Backend starting...\n");

  // 1. Connect to MongoDB
  await connectDB();

  // 2. Pre-warm ETH price cache
  try {
    const price = await getETHPrice();
    console.log(`💱 ETH price loaded: $${price}`);
  } catch (e) {
    console.warn("⚠️  Could not pre-load ETH price");
  }

  // 3. Start cron jobs
  startAllJobs();

  // 4. Watch project wallet for incoming deposits
  if (process.env.PROJECT_WALLET_ADDRESS && process.env.ETH_RPC_URL?.includes("infura")) {
    watchProjectWallet(({ user, ethAmount }) => {
      console.log(`🎉 Deposit confirmed: ${ethAmount} ETH for user ${user.walletAddress}`);
    });
  } else {
    console.log("⚠️  Wallet watcher skipped (set ETH_RPC_URL + PROJECT_WALLET_ADDRESS in .env)");
  }

  // 5. Start HTTP server
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`   Health:   GET  /health`);
    console.log(`   Wallet:   POST /api/wallet/challenge`);
    console.log(`   Wallet:   POST /api/wallet/verify`);
    console.log(`   Income:   POST /api/income/collect`);
    console.log(`   Exchange: POST /api/exchange/swap`);
    console.log(`   Mining:   POST /api/mining/activate\n`);
  });
}

bootstrap().catch(err => {
  console.error("❌ Fatal bootstrap error:", err);
  process.exit(1);
});
