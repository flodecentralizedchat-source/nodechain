import { useState } from 'react'

const WALLETS = [
  { name: 'MetaMask',      icon: '🦊', bg: '#FFF4E5', desc: 'Browser extension wallet' },
  { name: 'WalletConnect', icon: '🔗', bg: '#E8F0FF', desc: 'Mobile wallet via QR code' },
  { name: 'Trust Wallet',  icon: '🛡️', bg: '#E8F4EF', desc: 'Mobile & browser wallet'  },
]

export default function ConnectPage({ onConnect, connecting, error }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (name) => {
    setSelected(name)
    onConnect()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #f7f6f2 60%, #e8f4ef 100%)',
      padding: 24,
    }}>
      <style>{`
        .connect-card {
          background: white; border-radius: 28px; padding: 48px 36px;
          width: 100%; max-width: 400px;
          box-shadow: var(--shadow-lg);
          text-align: center;
          animation: fadeUp 0.6s ease both;
        }
        .logo-ring {
          width: 88px; height: 88px; border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; font-size: 36px;
          border: 3px solid var(--accent);
        }
        .wallet-option {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          border: 1.5px solid var(--border);
          border-radius: 12px; margin-bottom: 10px;
          cursor: pointer; transition: all 0.2s;
          text-align: left; background: white; width: 100%;
        }
        .wallet-option:hover,
        .wallet-option.selected {
          border-color: var(--accent);
          background: var(--accent-light);
        }
        .wallet-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
      `}</style>

      <div className="connect-card">
        <div className="logo-ring">⬡</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>NodeChain</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
          Connect your wallet to join the decentralized node network and start earning ETH rewards.
        </p>

        {!connecting ? (
          <>
            <p className="section-label">Select Wallet</p>
            {WALLETS.map(w => (
              <button
                key={w.name}
                className={`wallet-option ${selected === w.name ? 'selected' : ''}`}
                onClick={() => handleSelect(w.name)}
              >
                <div className="wallet-icon" style={{ background: w.bg }}>{w.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{w.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 18 }}>›</span>
              </button>
            ))}

            {error && (
              <div className="msg-box error" style={{ marginTop: 16, textAlign: 'left' }}>
                ✕ &nbsp;{error}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '24px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16, animation: 'pulse 1.5s ease infinite' }}>🔍</div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Connecting wallet…</p>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
              Check your wallet app to approve the signature request.
            </p>
          </div>
        )}

        <p style={{ marginTop: 28, fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
          Minimum <strong>0.001 ETH</strong> required to activate your node.
          We never request your private key.
        </p>
      </div>
    </div>
  )
}
