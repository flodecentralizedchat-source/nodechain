import { ethers } from "ethers";
import { getProvider, getProjectWallet, PROJECT_WALLET_ADDRESS } from "../config/wallet.config.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { getETHPrice } from "./priceService.js";

// ─── Generate a fresh wallet (for script use) ────────────────────────────────
export function generateNewWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase,
  };
}

// ─── Get project wallet's on-chain ETH balance ───────────────────────────────
export async function getProjectWalletBalance() {
  const provider = getProvider();
  const raw = await provider.getBalance(PROJECT_WALLET_ADDRESS);
  return parseFloat(ethers.formatEther(raw));
}

// ─── Verify a customer's on-chain ETH balance ────────────────────────────────
export async function getCustomerOnChainBalance(walletAddress) {
  try {
    const provider = getProvider();
    const raw = await provider.getBalance(walletAddress);
    return parseFloat(ethers.formatEther(raw));
  } catch (err) {
    console.error("getCustomerOnChainBalance error:", err.message);
    return 0;
  }
}

// ─── Check minimum ETH requirement (0.001 ETH) ───────────────────────────────
export async function hasMinimumETH(walletAddress, minEth = 0.001) {
  const balance = await getCustomerOnChainBalance(walletAddress);
  return { hasMinimum: balance >= minEth, balance };
}

// ─── Register or update a user when they connect ────────────────────────────
export async function registerOrUpdateUser(walletAddress) {
  const normalized = walletAddress.toLowerCase();

  let user = await User.findOne({ walletAddress: normalized });

  if (!user) {
    // New user
    user = await User.create({
      walletAddress: normalized,
      lastSeenAt: new Date(),
      firstConnectedAt: new Date(),
    });
    console.log(`👤 New user registered: ${normalized}`);
  } else {
    // Returning user
    user.lastSeenAt = new Date();
    user.connectionCount += 1;
    await user.save();
  }

  return user;
}

// ─── Record an incoming ETH deposit from a customer ─────────────────────────
// Called when we detect a tx to our project wallet
export async function recordDeposit(walletAddress, txHash, ethAmount) {
  const normalized = walletAddress.toLowerCase();
  const ethPrice = await getETHPrice();

  // Update user balance
  const user = await User.findOneAndUpdate(
    { walletAddress: normalized },
    {
      $inc: { ethBalance: ethAmount },
      $set: { lastSeenAt: new Date() },
    },
    { new: true }
  );

  if (!user) {
    console.warn("recordDeposit: user not found for", normalized);
    return null;
  }

  // Log transaction
  await Transaction.create({
    walletAddress: normalized,
    user: user._id,
    type: "deposit",
    txHash,
    ethAmount,
    ethPrice,
    direction: "in",
    status: "confirmed",
    note: "Customer ETH deposit to project wallet",
  });

  console.log(`💰 Deposit recorded: ${ethAmount} ETH from ${normalized}`);
  return user;
}

// ─── Listen for incoming transfers to project wallet ────────────────────────
// Call this once at startup to watch the blockchain
export function watchProjectWallet(onDeposit) {
  const provider = getProvider();

  console.log(`👁️  Watching project wallet: ${PROJECT_WALLET_ADDRESS}`);

  provider.on("block", async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block?.transactions) return;

      for (const tx of block.transactions) {
        // Check if this tx is sending ETH TO our project wallet
        if (tx.to?.toLowerCase() === PROJECT_WALLET_ADDRESS.toLowerCase() && tx.value > 0n) {
          const ethAmount = parseFloat(ethers.formatEther(tx.value));
          const fromAddress = tx.from.toLowerCase();

          console.log(`📥 Incoming tx detected: ${ethAmount} ETH from ${fromAddress} | hash: ${tx.hash}`);

          // Check if sender is a registered user
          const user = await User.findOne({ walletAddress: fromAddress });
          if (user) {
            await recordDeposit(fromAddress, tx.hash, ethAmount);
            if (onDeposit) onDeposit({ user, ethAmount, txHash: tx.hash });
          }
        }
      }
    } catch (err) {
      console.error("watchProjectWallet block error:", err.message);
    }
  });
}

// ─── Send ETH FROM project wallet to a customer address ─────────────────────
// Use for withdrawals (implement carefully — adds gas checks)
export async function sendETHFromProject(toAddress, ethAmount) {
  const wallet = getProjectWallet();
  const provider = getProvider();

  const feeData = await provider.getFeeData();
  const value = ethers.parseEther(ethAmount.toString());

  const tx = await wallet.sendTransaction({
    to: toAddress,
    value,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });

  console.log(`📤 Sent ${ethAmount} ETH to ${toAddress} | tx: ${tx.hash}`);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}
