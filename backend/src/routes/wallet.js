import express from "express";
import { hasMinimumETH, registerOrUpdateUser, getProjectWalletBalance } from "../services/walletService.js";
import { generateChallenge, verifyWalletSignature, issueToken } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { PROJECT_WALLET_ADDRESS } from "../config/wallet.config.js";

const router = express.Router();

// ─── GET /api/wallet/project-address ─────────────────────────────────────────
// Returns the project wallet address (so frontend knows where to send ETH)
router.get("/project-address", (req, res) => {
  res.json({
    success: true,
    address: PROJECT_WALLET_ADDRESS,
  });
});

// ─── POST /api/wallet/challenge ───────────────────────────────────────────────
// Step 1 of Web3 login: get a message to sign
router.post("/challenge", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

    // Check minimum ETH balance (skip check in development)
    const { hasMinimum, balance } = await hasMinimumETH(walletAddress)
    //if (!hasMinimum && process.env.NODE_ENV !== 'development') {
    if (false) {
      return res.status(403).json({
        error: 'Insufficient ETH balance',
        message: 'You need at least 0.001 ETH to connect your node.',
        balance,
        required: 0.001,
      })
    }

    const challenge = generateChallenge(walletAddress);
    res.json({ success: true, challenge, balance });

  } catch (err) {
    console.error("challenge error:", err);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

// ─── POST /api/wallet/verify ──────────────────────────────────────────────────
// Step 2: verify signed message, register user, return JWT
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "walletAddress, signature and message required" });
    }

    // Verify the signature
    const valid = verifyWalletSignature(message, signature, walletAddress);
    if (!valid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Register or update user in DB
    const user = await registerOrUpdateUser(walletAddress);

    // Issue JWT
    const token = issueToken(walletAddress);

    res.json({
      success: true,
      token,
      user: {
        walletAddress: user.walletAddress,
        ethBalance: user.ethBalance,
        usdtBalance: user.usdtBalance,
        totalEarned: user.totalEarned,
        level: user.level,
        joinDate: user.firstConnectedAt,
        secondsUntilIncome: user.secondsUntilIncome,
      },
    });

  } catch (err) {
    console.error("verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─── GET /api/wallet/me ───────────────────────────────────────────────────────
// Get current user profile (requires auth)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ walletAddress: req.walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        ethBalance: user.ethBalance,
        usdtBalance: user.usdtBalance,
        totalEarned: user.totalEarned,
        level: user.level,
        joinDate: user.firstConnectedAt,
        lastIncomeAt: user.lastIncomeAt,
        secondsUntilIncome: user.secondsUntilIncome,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/wallet/project-balance ─────────────────────────────────────────
// Project wallet on-chain balance (admin info)
router.get("/project-balance", requireAuth, async (req, res) => {
  try {
    const balance = await getProjectWalletBalance();
    res.json({ success: true, balance, address: PROJECT_WALLET_ADDRESS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
