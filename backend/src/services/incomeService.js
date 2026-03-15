import User from "../models/User.js";
import Income from "../models/Income.js";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import { getETHPrice } from "./priceService.js";

const INCOME_INTERVAL_HOURS = parseInt(process.env.INCOME_INTERVAL_HOURS || "6");
const BASE_INCOME_RATE = parseFloat(process.env.BASE_INCOME_RATE || "0.0082");

// ─── Calculate income for a single user ──────────────────────────────────────
function calculateUserIncome(user, activeOrders) {
  let income = BASE_INCOME_RATE;

  // Add mining machine income
  for (const order of activeOrders) {
    // dailyReturnPct is e.g. 0.8 (meaning 0.8% of activation cost per day)
    // Per 6-hour cycle = dailyReturn / 4
    const cycleReturn = (order.activationCostETH * order.dailyReturnPct) / 100 / 4;
    income += cycleReturn;
  }

  return parseFloat(income.toFixed(8));
}

// ─── Distribute income to a single user ─────────────────────────────────────
export async function distributeIncomeToUser(userId, ethPrice) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) return null;

  // Get active mining orders for this user
  const activeOrders = await Order.find({
    user: userId,
    status: "running",
    expiresAt: { $gt: new Date() },
  });

  const ethAmount = calculateUserIncome(user, activeOrders);
  const usdValue = parseFloat((ethAmount * ethPrice).toFixed(2));

  // Credit user balance
  user.ethBalance = parseFloat((user.ethBalance + ethAmount).toFixed(8));
  user.totalEarned = parseFloat((user.totalEarned + ethAmount).toFixed(8));
  user.pendingIncome = 0;
  user.lastIncomeAt = new Date();
  await user.save();

  // Update mining order profits
  for (const order of activeOrders) {
    const orderIncome = (order.activationCostETH * order.dailyReturnPct) / 100 / 4;
    order.totalProfitETH = parseFloat((order.totalProfitETH + orderIncome).toFixed(8));
    order.lastProfitAt = new Date();

    // Mark as completed if expired
    if (new Date() >= order.expiresAt) {
      order.status = "completed";
    }
    await order.save();
  }

  // Record income history
  const incomeRecord = await Income.create({
    user: user._id,
    walletAddress: user.walletAddress,
    ethAmount,
    ethPriceAtTime: ethPrice,
    usdValue,
    source: "auto_6h",
    status: "credited",
    distributedAt: new Date(),
  });

  // Log transaction
  await Transaction.create({
    walletAddress: user.walletAddress,
    user: user._id,
    type: "income",
    ethAmount,
    ethPrice,
    direction: "in",
    status: "confirmed",
    note: `Auto 6h income cycle`,
  });

  return { user, ethAmount, usdValue, incomeRecord };
}

// ─── Distribute income to ALL active users ───────────────────────────────────
export async function distributeIncomeToAllUsers() {
  const startTime = Date.now();
  console.log("\n⏰ [Income Job] Starting 6-hour income distribution...");

  const ethPrice = await getETHPrice();
  console.log(`   ETH Price: $${ethPrice}`);

  const intervalMs = INCOME_INTERVAL_HOURS * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - intervalMs);

  // Find users who are due for income (lastIncomeAt is null or older than 6 hours)
  const eligibleUsers = await User.find({
    isActive: true,
    $or: [
      { lastIncomeAt: null },
      { lastIncomeAt: { $lte: cutoff } },
    ],
  });

  console.log(`   Eligible users: ${eligibleUsers.length}`);

  let successCount = 0;
  let failCount = 0;
  let totalETHDistributed = 0;

  for (const user of eligibleUsers) {
    try {
      const result = await distributeIncomeToUser(user._id, ethPrice);
      if (result) {
        successCount++;
        totalETHDistributed += result.ethAmount;
        console.log(`   ✓ ${user.walletAddress.slice(0, 10)}… → +${result.ethAmount} ETH ($${result.usdValue})`);
      }
    } catch (err) {
      failCount++;
      console.error(`   ✕ Failed for ${user.walletAddress}: ${err.message}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ [Income Job] Done in ${duration}s`);
  console.log(`   Distributed: ${totalETHDistributed.toFixed(6)} ETH to ${successCount} users`);
  if (failCount) console.log(`   Failed: ${failCount} users`);

  return { successCount, failCount, totalETHDistributed, ethPrice };
}

// ─── Manual income collect (triggered by user clicking "Collect") ─────────────
export async function collectPendingIncome(walletAddress) {
  const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (!user) throw new Error("User not found");

  const ethPrice = await getETHPrice();
  const result = await distributeIncomeToUser(user._id, ethPrice);
  return result;
}
