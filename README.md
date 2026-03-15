# ⬡ NodeChain — Web3 Mining Node Platform

A full-stack Web3 DApp where customers connect their Ethereum wallet, activate mining nodes, and earn ETH income every 6 hours.

---

## Project Structure

```
nodechain/
├── backend/                          ← Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 ← MongoDB connection
│   │   │   └── wallet.config.js      ← Project wallet (ethers.js)
│   │   ├── models/
│   │   │   ├── User.js               ← Wallet address, ETH/USDT balances
│   │   │   ├── Income.js             ← 6h income history per user
│   │   │   ├── Order.js              ← Mining machine orders
│   │   │   └── Transaction.js        ← All ETH/USDT movements log
│   │   ├── services/
│   │   │   ├── walletService.js      ← On-chain ops, deposit watcher
│   │   │   ├── incomeService.js      ← 6h income distribution logic
│   │   │   └── priceService.js       ← Live ETH price (CoinGecko, cached)
│   │   ├── routes/
│   │   │   ├── wallet.js             ← /api/wallet/*  (auth)
│   │   │   ├── income.js             ← /api/income/*
│   │   │   ├── exchange.js           ← /api/exchange/*
│   │   │   └── mining.js             ← /api/mining/*
│   │   ├── middleware/
│   │   │   └── auth.js               ← JWT + wallet signature verify
│   │   ├── jobs/
│   │   │   └── cronJobs.js           ← 6h income, price refresh, expiry
│   │   └── index.js                  ← Express server entry
│   ├── scripts/
│   │   ├── generateWallet.js         ← Generate your project wallet
│   │   └── seed.js                   ← Seed dev test data
│   ├── package.json
│   └── .env.example
│
├── frontend/                         ← React + Vite + ethers.js
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Connect.jsx           ← Web3 wallet login (MetaMask etc.)
│   │   │   ├── Home.jsx              ← Profile, balances, platform overview
│   │   │   ├── Account.jsx           ← Income timer, collect, ETH→USDT swap
│   │   │   ├── Mining.jsx            ← Mining machine catalog + activation
│   │   │   └── Orders.jsx            ← Active & completed orders
│   │   ├── hooks/
│   │   │   ├── useWeb3.js            ← Wallet connect, sign, JWT auth
│   │   │   └── useEthPrice.js        ← Live ETH/USDT price (auto-refresh)
│   │   ├── components/
│   │   │   ├── BottomNav.jsx         ← Mobile tab navigation
│   │   │   └── TopBar.jsx            ← Header with wallet address
│   │   ├── utils/
│   │   │   ├── api.js                ← All backend API calls
│   │   │   └── format.js             ← ETH, USD, date formatters
│   │   ├── App.jsx                   ← Root component, routing
│   │   ├── index.css                 ← Global styles + CSS variables
│   │   └── main.jsx                  ← React DOM entry
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── package.json                      ← Root scripts (run both together)
└── .gitignore
```

---

## Quick Start

### Step 1 — Install all dependencies

```bash
npm run install:all
```

Or manually:
```bash
cd backend  && npm install
cd frontend && npm install
```

---

### Step 2 — Generate your project wallet

```bash
npm run wallet:gen
```

Output:
```
PROJECT_WALLET_ADDRESS=0xABC...
PROJECT_WALLET_PRIVATE_KEY=0xprivate...
Mnemonic: word word word ...
```

⚠️ **Save the mnemonic phrase offline. Never share or commit the private key.**

---

### Step 3 — Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nodechain

JWT_SECRET=<generate a random 64-char string>

PROJECT_WALLET_ADDRESS=<from Step 2>
PROJECT_WALLET_PRIVATE_KEY=<from Step 2>

# Get free key at https://infura.io
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Optional — increases CoinGecko rate limits
COINGECKO_API_KEY=

FRONTEND_URL=http://localhost:3000
INCOME_INTERVAL_HOURS=6
BASE_INCOME_RATE=0.0082
```

---

### Step 4 — Configure frontend environment

```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env` (dev — uses Vite proxy, no change needed):
```env
VITE_API_URL=http://localhost:4000/api
```

---

### Step 5 — Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu / Debian
sudo systemctl start mongod

# Docker (easiest)
docker run -d -p 27017:27017 --name mongo mongo:7
```

---

### Step 6 — Run in development

```bash
# Both frontend + backend together
npm run dev

# Or separately:
npm run dev:backend   # → http://localhost:4000
npm run dev:frontend  # → http://localhost:3000
```

---

### Step 7 — Seed test data (optional)

```bash
npm run seed
```

Creates a test user with ETH balance, 2 active orders, and 5 income records.

---

## API Reference

### Auth (no token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | /api/wallet/project-address | Project wallet address |
| POST | /api/wallet/challenge       | Get sign-in message (checks 0.001 ETH min) |
| POST | /api/wallet/verify          | Verify signature → JWT token |

### Authenticated (Bearer token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | /api/wallet/me             | Current user profile |
| POST | /api/income/collect        | Collect 6h income |
| GET  | /api/income/history        | Income history (paginated) |
| GET  | /api/income/summary        | Total earned summary |
| GET  | /api/exchange/rate         | Live ETH/USDT rate |
| POST | /api/exchange/swap         | Swap ETH → USDT |
| GET  | /api/mining/machines       | Machine catalog |
| POST | /api/mining/activate       | Activate a machine |
| GET  | /api/mining/orders         | User orders |
| GET  | /api/mining/summary        | Orders summary |

---

## How Web3 Login Works

```
1. Frontend: window.ethereum.request({ method: 'eth_requestAccounts' })
                    ↓
2. Backend:  POST /api/wallet/challenge  →  returns message to sign
                    ↓
3. Frontend: window.ethereum.request({ method: 'personal_sign', ... })
                    ↓
4. Backend:  POST /api/wallet/verify  →  verifies signature, returns JWT
                    ↓
5. Frontend: stores JWT in localStorage, uses as Bearer token for all requests
```

---

## How the 6-Hour Income Works

```
Cron: 00:00, 06:00, 12:00, 18:00 UTC (node-cron)
         ↓
For each eligible user:
  income = BASE_INCOME (0.0082 ETH)
         + Σ (order.activationCost × dailyReturnPct% / 4)
         ↓
  user.ethBalance  += income
  user.totalEarned += income
  Income record saved
  Transaction logged
  Mining order profits updated
```

---

## How the Project Wallet Works

```
Customer on-chain wallet
         │
         │  sends ETH
         ▼
YOUR PROJECT_WALLET_ADDRESS  (on Ethereum mainnet)
         │
         │  walletService.watchProjectWallet()
         │  listens on every new block
         ▼
Detects incoming tx → credits user.ethBalance in MongoDB
```

---

## Production Deployment

### Backend (Railway / Render / DigitalOcean)
1. Push `backend/` to your host
2. Set all env vars in the dashboard
3. Run: `npm start`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL=https://your-backend.com/api` in env vars
2. Build command: `npm run build`
3. Publish directory: `dist/`

---

## Mining Machines

| Machine | Hashrate | Cost | Daily Return | Duration | Total Return |
|---------|----------|------|-------------|----------|-------------|
| Nano Node | 50 MH/s | 0.05 ETH | 0.8% | 30 days | 0.012 ETH |
| Standard Node | 200 MH/s | 0.2 ETH | 1.2% | 60 days | 0.144 ETH |
| Pro Node | 800 MH/s | 0.8 ETH | 1.8% | 90 days | 1.296 ETH |
| Elite Node | 2 GH/s | 2.0 ETH | 2.5% | 180 days | 9.0 ETH |
# nodechain
