import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Ethereum wallet address (primary identifier)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },

  // Tracked balances (managed by our backend)
  ethBalance: { type: Number, default: 0, min: 0 },
  usdtBalance: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0, min: 0 },

  // Income state
  lastIncomeAt: { type: Date, default: null },
  pendingIncome: { type: Number, default: 0 },

  // Profile
  level: {
    type: String,
    enum: ["Node Watcher", "Node Operator", "Node Master", "Node Elite"],
    default: "Node Operator",
  },
  isActive: { type: Boolean, default: true },

  // Connection tracking
  firstConnectedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  connectionCount: { type: Number, default: 1 },
}, { timestamps: true });

// Virtual: next income time
userSchema.virtual("nextIncomeAt").get(function () {
  if (!this.lastIncomeAt) return new Date();
  const next = new Date(this.lastIncomeAt);
  next.setHours(next.getHours() + parseInt(process.env.INCOME_INTERVAL_HOURS || 6));
  return next;
});

// Virtual: seconds until next income
userSchema.virtual("secondsUntilIncome").get(function () {
  const diff = this.nextIncomeAt - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
});

userSchema.set("toJSON", { virtuals: true });

export default mongoose.model("User", userSchema);
