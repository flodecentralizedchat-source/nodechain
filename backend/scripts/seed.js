// Run: node scripts/seed.js
// Seeds the DB with test users and orders for local development

import "dotenv/config";
import mongoose from "mongoose";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const User   = (await import("../src/models/User.js")).default;
  const Order  = (await import("../src/models/Order.js")).default;
  const Income = (await import("../src/models/Income.js")).default;

  // Clear existing
  await Promise.all([User.deleteMany(), Order.deleteMany(), Income.deleteMany()]);
  console.log("Cleared existing data");

  // Create test user
  const user = await User.create({
    walletAddress: "0x742d35cc6634c0532925a3b8d4c9b8f1234abcd",
    ethBalance: 2.4851,
    usdtBalance: 1240.50,
    totalEarned: 0.3847,
    lastIncomeAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    level: "Node Operator",
  });

  // Create test orders
  const now = new Date();
  await Order.create([
    {
      user: user._id,
      walletAddress: user.walletAddress,
      machineId: 2,
      machineName: "Standard Node",
      hashrate: "200 MH/s",
      dailyReturnPct: 1.2,
      durationDays: 60,
      activationCostETH: 0.2,
      totalProfitETH: 0.0312,
      activatedAt: new Date(now - 43 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now + 17 * 24 * 60 * 60 * 1000),
      status: "running",
    },
    {
      user: user._id,
      walletAddress: user.walletAddress,
      machineId: 1,
      machineName: "Nano Node",
      hashrate: "50 MH/s",
      dailyReturnPct: 0.8,
      durationDays: 30,
      activationCostETH: 0.05,
      totalProfitETH: 0.0198,
      activatedAt: new Date(now - 27 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now + 3 * 24 * 60 * 60 * 1000),
      status: "running",
    },
  ]);

  // Create income records
  for (let i = 0; i < 5; i++) {
    await Income.create({
      user: user._id,
      walletAddress: user.walletAddress,
      ethAmount: 0.0082,
      ethPriceAtTime: 1987 + Math.random() * 100,
      usdValue: 16.28,
      source: "auto_6h",
      status: "credited",
      distributedAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000),
    });
  }

  console.log("✅ Seed complete");
  console.log(`   User: ${user.walletAddress}`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
