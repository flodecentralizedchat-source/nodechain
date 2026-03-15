import { ethers } from "ethers";

let _provider = null;
let _wallet = null;

export function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
  }
  return _provider;
}

export function getProjectWallet() {
  if (!_wallet) {
    if (!process.env.PROJECT_WALLET_PRIVATE_KEY) {
      throw new Error("PROJECT_WALLET_PRIVATE_KEY not set in .env");
    }
    _wallet = new ethers.Wallet(process.env.PROJECT_WALLET_PRIVATE_KEY, getProvider());
  }
  return _wallet;
}

export const PROJECT_WALLET_ADDRESS = process.env.PROJECT_WALLET_ADDRESS;
