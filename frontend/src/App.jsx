import './index.css'
import { useState } from 'react'
import { useWeb3 }     from './hooks/useWeb3.js'
import { useEthPrice } from './hooks/useEthPrice.js'

import BottomNav  from './components/BottomNav.jsx'
import TopBar     from './components/TopBar.jsx'
import ConnectPage from './pages/Connect.jsx'
import HomePage    from './pages/Home.jsx'
import AccountPage from './pages/Account.jsx'
import MiningPage  from './pages/Mining.jsx'
import OrdersPage  from './pages/Orders.jsx'

export default function App() {
  const web3     = useWeb3()
  const { price: ethPrice } = useEthPrice()
  const [page, setPage] = useState('home')

  // ── Loading splash ────────────────────────────────────────────────────
  if (web3.loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          fontSize: 48, marginBottom: 16,
          animation: 'pulse 1.5s ease infinite',
        }}>
          ⬡
        </div>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 22, color: 'var(--accent)',
        }}>
          NodeChain
        </div>
      </div>
    )
  }

  // ── Not connected → show connect page ────────────────────────────────
  if (!web3.user) {
    return (
      <ConnectPage
        onConnect={web3.connect}
        connecting={web3.connecting}
        error={web3.error}
      />
    )
  }

  // ── Connected → main app ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      <TopBar
        user={web3.user}
        ethPrice={ethPrice}
        onDisconnect={web3.disconnect}
      />

      {page === 'home' && (
        <HomePage
          user={web3.user}
          ethPrice={ethPrice}
        />
      )}
      {page === 'account' && (
        <AccountPage
          user={web3.user}
          ethPrice={ethPrice}
          token={web3.token}
          onRefresh={web3.refreshUser}
        />
      )}
      {page === 'mining' && (
        <MiningPage
          token={web3.token}
          userEthBalance={web3.user.ethBalance}
          onRefresh={web3.refreshUser}
        />
      )}
      {page === 'orders' && (
        <OrdersPage
          token={web3.token}
        />
      )}

      <BottomNav page={page} setPage={setPage} />
    </div>
  )
}
