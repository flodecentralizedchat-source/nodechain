import { formatAddress } from '../utils/format.js'

export default function TopBar({ user, ethPrice, onDisconnect }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(247,246,242,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 20, color: 'var(--accent)',
      }}>
        ⬡ NodeChain
      </span>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {ethPrice && (
          <div style={{
            fontSize: 12, color: 'var(--accent2)', fontWeight: 600,
          }}>
            ${ethPrice.toLocaleString()}
          </div>
        )}
        <div style={{
          background: 'var(--accent-light)', color: 'var(--accent)',
          borderRadius: 20, padding: '5px 12px',
          fontSize: 12, fontWeight: 600,
        }}>
          {formatAddress(user?.walletAddress)}
        </div>
        <button onClick={onDisconnect} style={{
          background: 'var(--surface2)', color: 'var(--text3)',
          borderRadius: 20, padding: '5px 10px',
          fontSize: 12, border: '1px solid var(--border)',
          transition: 'all 0.2s',
        }}>
          Exit
        </button>
      </div>
    </div>
  )
}
