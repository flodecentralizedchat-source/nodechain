import cron from "node-cron";
import { distributeIncomeToAllUsers } from "../services/incomeService.js";
import { getETHPrice } from "../services/priceService.js";

// ─── 6-Hour Income Distribution Cron ─────────────────────────────────────────
// Runs at: 00:00, 06:00, 12:00, 18:00 every day (UTC)
export function startIncomeJob() {
  console.log("⏰ Income cron job scheduled: every 6 hours (0,6,12,18:00 UTC)");

  cron.schedule("0 0,6,12,18 * * *", async () => {
    try {
      await distributeIncomeToAllUsers();
    } catch (err) {
      console.error("❌ Income cron job failed:", err.message);
    }
  }, { timezone: "UTC" });
}

// ─── Price Cache Refresh (every 1 minute) ────────────────────────────────────
export function startPriceRefreshJob() {
  console.log("📈 Price refresh cron scheduled: every minute");

  cron.schedule("* * * * *", async () => {
    try {
      await getETHPrice();
    } catch (err) {
      console.warn("Price refresh failed:", err.message);
    }
  });
}

// ─── Mining Order Expiry Check (every hour) ───────────────────────────────────
export function startOrderExpiryJob() {
  const Order = import("../models/Order.js").then(m => m.default);

  console.log("⬡ Order expiry check scheduled: every hour");

  cron.schedule("0 * * * *", async () => {
    const OrderModel = await Order;
    const expired = await OrderModel.updateMany(
      { status: "running", expiresAt: { $lte: new Date() } },
      { $set: { status: "completed" } }
    );
    if (expired.modifiedCount > 0) {
      console.log(`✅ Marked ${expired.modifiedCount} orders as completed`);
    }
  });
}

// ─── Start all jobs ───────────────────────────────────────────────────────────
export function startAllJobs() {
  startIncomeJob();
  startPriceRefreshJob();
  startOrderExpiryJob();
  console.log("✅ All cron jobs started\n");
}
