import { formatAddress, formatDate, formatETH, formatUSD } from '../utils/format.js'

const FEATURES = [
  { icon: '◎', title: '6-Hour Income Cycle',    desc: 'Earnings distributed automatically to your account every 6 hours.' },
  { icon: '⇄', title: 'ETH → USDT Exchange',    desc: 'Swap ETH earnings to USDT instantly at the live market rate.' },
  { icon: '⬡', title: 'Mining Nodes',            desc: 'Activate mining machines and earn daily passive income by hashrate.' },
  { icon: '≡', title: 'Order Tracking',          desc: 'Monitor all active machines, uptime, and profits in real-time.' },
]

export default function HomePage({ user, ethPrice }) {
  return (
    <div style={{ padding: '28px 20px 100px' }}>
      <style>{`
        .home-header {
          background: var(--accent); border-radius: 24px;
          padding: 28px 24px; color: white; margin-bottom: 20px;
        }
        .avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700;
          border: 2px solid rgba(255,255,255,0.4);
        }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 18px 16px; box-shadow: var(--shadow);
        }
        .feature-card {
          display: flex; gap: 16px; align-items: flex-start;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px; margin-bottom: 12px;
          box-shadow: var(--shadow); transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .feature-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          background: var(--accent-light); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); font-size: 20px;
        }
      `}</style>

      {/* Profile header */}
      <div className="home-header fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="avatar">
            {(user.walletAddress || '').slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20 }}>{user.level}</div>
            <div style={{ opacity: 0.75, fontSize: 13, marginTop: 3 }}>
              {formatAddress(user.walletAddress)}
            </div>
          </div>
          <div style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600,
          }}>
            ● LIVE
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'ETH Balance',  value: formatETH(user.ethBalance)      },
            { label: 'USDT Balance', value: formatUSD(user.usdtBalance)     },
            { label: 'Joined',       value: formatDate(user.joinDate)       },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', float: 'left', height: '100%', marginRight: 16 }}/>}
              <div style={{ paddingLeft: i > 0 ? 0 : 0 }}>
                <div style={{ opacity: 0.7, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: i < 2 ? 20 : 14, marginTop: i === 2 ? 4 : 0 }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid fade-up fade-up-1">
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 6 }}>Total Earned</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: 'var(--accent)' }}>
            {formatETH(user.totalEarned)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>ETH lifetime</div>
        </div>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 6 }}>ETH Price</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: 'var(--accent2)' }}>
            {ethPrice ? `$${ethPrice.toLocaleString()}` : '…'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Live · CoinGecko</div>
        </div>
      </div>

      {/* How it works */}
      <div className="fade-up fade-up-2">
        <p className="section-label">How it works</p>
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
