import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  walletAddress: { type: String, required: true, lowercase: true, index: true },

  // Amounts
  ethAmount: { type: Number, required: true },
  ethPriceAtTime: { type: Number },           // USD price of ETH when income was distributed
  usdValue: { type: Number },                  // ethAmount * ethPriceAtTime

  // Source
  source: {
    type: String,
    enum: ["auto_6h", "manual_collect", "mining_reward", "bonus"],
    default: "auto_6h",
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "credited", "failed"],
    default: "credited",
  },

  distributedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Income", incomeSchema);
