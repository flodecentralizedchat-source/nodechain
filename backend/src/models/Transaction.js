import mongoose from "mongoose";

const txSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, lowercase: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: {
    type: String,
    enum: ["deposit", "income", "exchange_eth_to_usdt", "mining_activation", "withdrawal"],
    required: true,
  },

  // On-chain tx hash (if applicable)
  txHash: { type: String, sparse: true },

  // Amounts
  ethAmount: { type: Number, default: 0 },
  usdtAmount: { type: Number, default: 0 },
  ethPrice: { type: Number },               // ETH/USD at time of tx

  // Direction
  direction: { type: String, enum: ["in", "out"], required: true },

  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "confirmed",
  },

  note: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export default mongoose.model("Transaction", txSchema);
