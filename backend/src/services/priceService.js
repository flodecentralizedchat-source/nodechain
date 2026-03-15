import axios from "axios";

// ─── In-memory cache ──────────────────────────────────────────────────────────
let _cache = {
  ethUsd: null,
  fetchedAt: null,
};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// ─── Fetch live ETH price ─────────────────────────────────────────────────────
export async function getETHPrice() {
  const now = Date.now();

  // Return cached value if fresh
  if (_cache.ethUsd && _cache.fetchedAt && now - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache.ethUsd;
  }

  try {
    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const res = await axios.get(
      `${process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3"}/simple/price`,
      {
        params: { ids: "ethereum", vs_currencies: "usd" },
        headers,
        timeout: 8000,
      }
    );

    const price = res.data?.ethereum?.usd;
    if (!price) throw new Error("Invalid CoinGecko response");

    _cache = { ethUsd: price, fetchedAt: now };
    console.log(`📈 ETH price refreshed: $${price}`);
    return price;

  } catch (err) {
    console.warn("⚠️  CoinGecko fetch failed:", err.message);

    // Fallback: return stale cache if available
    if (_cache.ethUsd) {
      console.warn("   Using stale cached price:", _cache.ethUsd);
      return _cache.ethUsd;
    }

    // Last resort fallback
    return 2000;
  }
}

// ─── Convert ETH amount to USDT ───────────────────────────────────────────────
export async function ethToUsdt(ethAmount) {
  const price = await getETHPrice();
  return parseFloat((ethAmount * price).toFixed(2));
}

// ─── Convert USDT to ETH ─────────────────────────────────────────────────────
export async function usdtToEth(usdtAmount) {
  const price = await getETHPrice();
  return parseFloat((usdtAmount / price).toFixed(8));
}

// ─── Get cached price synchronously (for non-critical use) ───────────────────
export function getCachedETHPrice() {
  return _cache.ethUsd || 2000;
}
