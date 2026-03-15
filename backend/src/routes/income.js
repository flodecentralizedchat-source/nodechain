import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { collectPendingIncome } from "../services/incomeService.js";
import Income from "../models/Income.js";

const router = express.Router();

// ─── POST /api/income/collect ─────────────────────────────────────────────────
// User manually triggers income collection
router.post("/collect", requireAuth, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ walletAddress: req.walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if 6 hours have passed since last income
    const INTERVAL_MS = parseInt(process.env.INCOME_INTERVAL_HOURS || 6) * 60 * 60 * 1000;
    if (user.lastIncomeAt) {
      const elapsed = Date.now() - user.lastIncomeAt.getTime();
      if (elapsed < INTERVAL_MS) {
        const secondsLeft = Math.floor((INTERVAL_MS - elapsed) / 1000);
        return res.status(429).json({
          error: "Income not ready yet",
          secondsUntilNext: secondsLeft,
          message: `Next income available in ${Math.floor(secondsLeft / 3600)}h ${Math.floor((secondsLeft % 3600) / 60)}m`,
        });
      }
    }

    const result = await collectPendingIncome(req.walletAddress);

    res.json({
      success: true,
      ethAmount: result.ethAmount,
      usdValue: result.usdValue,
      newEthBalance: result.user.ethBalance,
      newTotalEarned: result.user.totalEarned,
    });

  } catch (err) {
    console.error("collect income error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/income/history ──────────────────────────────────────────────────
// Get user's income history (paginated)
router.get("/history", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Income.find({ walletAddress: req.walletAddress })
        .sort({ distributedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Income.countDocuments({ walletAddress: req.walletAddress }),
    ]);

    res.json({
      success: true,
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/income/summary ──────────────────────────────────────────────────
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const result = await Income.aggregate([
      { $match: { walletAddress: req.walletAddress } },
      {
        $group: {
          _id: null,
          totalETH: { $sum: "$ethAmount" },
          totalUSD: { $sum: "$usdValue" },
          count: { $sum: 1 },
          lastIncome: { $max: "$distributedAt" },
        },
      },
    ]);

    const summary = result[0] || { totalETH: 0, totalUSD: 0, count: 0, lastIncome: null };
    res.json({ success: true, summary });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
