import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  walletAddress: { type: String, required: true, lowercase: true, index: true },

  // Machine details
  machineId: { type: Number, required: true },
  machineName: { type: String, required: true },
  hashrate: { type: String },
  dailyReturnPct: { type: Number, required: true }, // e.g. 0.8 for 0.8%
  durationDays: { type: Number, required: true },

  // Financial
  activationCostETH: { type: Number, required: true },
  totalProfitETH: { type: Number, default: 0 },

  // Lifecycle
  activatedAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: function () {
      const d = new Date();
      d.setDate(d.getDate() + this.durationDays);
      return d;
    },
  },

  status: {
    type: String,
    enum: ["running", "completed", "cancelled"],
    default: "running",
  },

  // Track last profit cycle
  lastProfitAt: { type: Date, default: null },
}, { timestamps: true });

// Virtual: progress percentage
orderSchema.virtual("progressPct").get(function () {
  const total = this.expiresAt - this.activatedAt;
  const elapsed = Date.now() - this.activatedAt;
  return Math.min(100, Math.floor((elapsed / total) * 100));
});

orderSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Order", orderSchema);
