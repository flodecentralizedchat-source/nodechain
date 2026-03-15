import jwt from "jsonwebtoken";
import { ethers } from "ethers";

// ─── Generate a sign-in challenge message ────────────────────────────────────
export function generateChallenge(walletAddress) {
  const timestamp = Date.now();
  return `Sign in to NodeChain\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nThis request does not trigger a blockchain transaction.`;
}

// ─── Verify a signed message from customer wallet ─────────────────────────────
export function verifyWalletSignature(message, signature, expectedAddress) {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

// ─── Issue a JWT for an authenticated wallet ──────────────────────────────────
export function issueToken(walletAddress) {
  return jwt.sign(
    { walletAddress: walletAddress.toLowerCase() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ─── Express middleware: require valid JWT ────────────────────────────────────
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.walletAddress = decoded.walletAddress;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
