import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getETHPrice, ethToUsdt } from "../services/priceService.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// ─── GET /api/exchange/rate ───────────────────────────────────────────────────
// Get live ETH/USDT rate
router.get("/rate", async (req, res) => {
  try {
    const price = await getETHPrice();
    res.json({
      success: true,
      ethUsd: price,
      usdEth: parseFloat((1 / price).toFixed(8)),
      updatedAt: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/exchange/preview ───────────────────────────────────────────────
// Preview how much USDT you'd get for X ETH (no state change)
router.post("/preview", requireAuth, async (req, res) => {
  try {
    const { ethAmount } = req.body;
    if (!ethAmount || ethAmount <= 0) return res.status(400).json({ error: "Invalid ethAmount" });

    const ethPrice = await getETHPrice();
    const usdtOut = parseFloat((ethAmount * ethPrice).toFixed(2));

    res.json({
      success: true,
      ethIn: ethAmount,
      usdtOut,
      rate: ethPrice,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/exchange/swap ──────────────────────────────────────────────────
// Execute ETH → USDT swap (deducts ETH, adds USDT to user balance)
router.post("/swap", requireAuth, async (req, res) => {
  try {
    const { ethAmount } = req.body;
    const amount = parseFloat(ethAmount);

    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid ethAmount" });
    if (amount < 0.0001) return res.status(400).json({ error: "Minimum swap is 0.0001 ETH" });

    const user = await User.findOne({ walletAddress: req.walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check sufficient ETH balance
    if (user.ethBalance < amount) {
      return res.status(400).json({
        error: "Insufficient ETH balance",
        available: user.ethBalance,
        requested: amount,
      });
    }

    // Get live rate
    const ethPrice = await getETHPrice();
    const usdtOut = parseFloat((amount * ethPrice).toFixed(2));

    // Execute swap: deduct ETH, add USDT
    user.ethBalance = parseFloat((user.ethBalance - amount).toFixed(8));
    user.usdtBalance = parseFloat((user.usdtBalance + usdtOut).toFixed(2));
    await user.save();

    // Log transaction
    await Transaction.create({
      walletAddress: req.walletAddress,
      user: user._id,
      type: "exchange_eth_to_usdt",
      ethAmount: amount,
      usdtAmount: usdtOut,
      ethPrice,
      direction: "in",
      note: `Swapped ${amount} ETH → ${usdtOut} USDT @ $${ethPrice}`,
    });

    res.json({
      success: true,
      ethSwapped: amount,
      usdtReceived: usdtOut,
      rate: ethPrice,
      newEthBalance: user.ethBalance,
      newUsdtBalance: user.usdtBalance,
    });

  } catch (err) {
    console.error("swap error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
