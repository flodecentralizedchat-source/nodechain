import express from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import { getETHPrice } from "../services/priceService.js";

const router = express.Router();

// ─── Mining machine catalog ───────────────────────────────────────────────────
const MACHINES = [
  { id: 1, name: "Nano Node",     hashrate: "50 MH/s",  price: 0.05, dailyReturnPct: 0.8,  durationDays: 30  },
  { id: 2, name: "Standard Node", hashrate: "200 MH/s", price: 0.2,  dailyReturnPct: 1.2,  durationDays: 60  },
  { id: 3, name: "Pro Node",      hashrate: "800 MH/s", price: 0.8,  dailyReturnPct: 1.8,  durationDays: 90  },
  { id: 4, name: "Elite Node",    hashrate: "2 GH/s",   price: 2.0,  dailyReturnPct: 2.5,  durationDays: 180 },
];

// ─── GET /api/mining/machines ─────────────────────────────────────────────────
router.get("/machines", async (req, res) => {
  const ethPrice = await getETHPrice();
  const catalog = MACHINES.map(m => ({
    ...m,
    priceUSD: parseFloat((m.price * ethPrice).toFixed(2)),
    dailyEarning: parseFloat((m.price * m.dailyReturnPct / 100).toFixed(6)),
    totalReturn: parseFloat((m.price * m.dailyReturnPct / 100 * m.durationDays).toFixed(6)),
  }));
  res.json({ success: true, machines: catalog, ethPrice });
});

// ─── POST /api/mining/activate ────────────────────────────────────────────────
router.post("/activate", requireAuth, async (req, res) => {
  try {
    const { machineId } = req.body;
    const machine = MACHINES.find(m => m.id === parseInt(machineId));
    if (!machine) return res.status(400).json({ error: "Invalid machine ID" });

    const user = await User.findOne({ walletAddress: req.walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check ETH balance
    if (user.ethBalance < machine.price) {
      return res.status(400).json({
        error: "Insufficient ETH balance",
        available: user.ethBalance,
        required: machine.price,
      });
    }

    // Deduct activation cost
    user.ethBalance = parseFloat((user.ethBalance - machine.price).toFixed(8));
    await user.save();

    // Create order
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + machine.durationDays);

    const order = await Order.create({
      user: user._id,
      walletAddress: req.walletAddress,
      machineId: machine.id,
      machineName: machine.name,
      hashrate: machine.hashrate,
      dailyReturnPct: machine.dailyReturnPct,
      durationDays: machine.durationDays,
      activationCostETH: machine.price,
      expiresAt,
      status: "running",
    });

    // Log transaction
    const ethPrice = await getETHPrice();
    await Transaction.create({
      walletAddress: req.walletAddress,
      user: user._id,
      type: "mining_activation",
      ethAmount: machine.price,
      ethPrice,
      direction: "out",
      note: `Activated ${machine.name}`,
    });

    res.json({
      success: true,
      order: {
        id: order._id,
        machineName: order.machineName,
        activationCostETH: order.activationCostETH,
        dailyReturnPct: order.dailyReturnPct,
        durationDays: order.durationDays,
        expiresAt: order.expiresAt,
        status: order.status,
      },
      newEthBalance: user.ethBalance,
    });

  } catch (err) {
    console.error("activate mining error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/mining/orders ───────────────────────────────────────────────────
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { walletAddress: req.walletAddress };
    if (status) filter.status = status;

    const orders = await Order.find(filter).sort({ activatedAt: -1 }).lean();

    // Add computed fields
    const enriched = orders.map(o => ({
      ...o,
      progressPct: Math.min(100, Math.floor(
        ((Date.now() - new Date(o.activatedAt)) /
         (new Date(o.expiresAt) - new Date(o.activatedAt))) * 100
      )),
    }));

    res.json({ success: true, orders: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/mining/summary ──────────────────────────────────────────────────
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const [activeOrders, allOrders] = await Promise.all([
      Order.find({ walletAddress: req.walletAddress, status: "running" }),
      Order.find({ walletAddress: req.walletAddress }),
    ]);

    const totalProfit = allOrders.reduce((s, o) => s + o.totalProfitETH, 0);
    const activeHashrate = activeOrders.reduce((s, o) => {
      const machine = MACHINES.find(m => m.id === o.machineId);
      return s + (machine ? parseFloat(machine.hashrate) : 0);
    }, 0);

    res.json({
      success: true,
      activeCount: activeOrders.length,
      totalCount: allOrders.length,
      totalProfitETH: parseFloat(totalProfit.toFixed(8)),
      activeHashrateMH: activeHashrate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
