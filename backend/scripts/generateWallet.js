// Run: node scripts/generateWallet.js
// This generates a fresh Ethereum wallet for your project
// Copy the output into your .env file — KEEP THE PRIVATE KEY SECRET

import { ethers } from "ethers";

const wallet = ethers.Wallet.createRandom();

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║         NodeChain — Project Wallet Generator         ║");
console.log("╚══════════════════════════════════════════════════════╝\n");
console.log("✅ New wallet generated!\n");
console.log("Add these to your .env file:\n");
console.log(`PROJECT_WALLET_ADDRESS=${wallet.address}`);
console.log(`PROJECT_WALLET_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`\nMnemonic (backup phrase — store offline):`);
console.log(wallet.mnemonic?.phrase);
console.log("\n⚠️  WARNING: Never share your private key or mnemonic!");
console.log("⚠️  Store the mnemonic phrase in a secure offline location.\n");
