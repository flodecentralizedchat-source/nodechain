import { useState, useEffect } from 'react'
import { miningAPI } from '../utils/api.js'
import { formatETH, formatDate } from '../utils/format.js'

export default function OrdersPage({ token }) {
  const [orders,  setOrders]  = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all') // all | running | completed

  useEffect(() => {
    Promise.all([
      miningAPI.orders(token),
      miningAPI.summary(token),
    ])
      .then(([o, s]) => {
        setOrders(o.orders || [])
        setSummary(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const visible = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  return (
    <div style={{ padding: '28px 20px 100px' }}>
      <style>{`
        .order-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 22px; margin-bottom: 16px;
          box-shadow: var(--shadow);
        }
        .progress-bar {
          height: 6px; background: var(--border);
          border-radius: 10px; overflow: hidden; margin-top: 12px;
        }
        .progress-fill {
          height: 100%; border-radius: 10px;
          transition: width 1.2s ease;
        }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          display: inline-block; margin-right: 5px;
        }
        .filter-btn {
          padding: 7px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 500;
          transition: all 0.2s; border: 1.5px solid var(--border);
          background: var(--surface);
        }
        .filter-btn.active {
          background: var(--accent); color: white; border-color: var(--accent);
        }
      `}</style>

      <h2 style={{ fontSize: 26, marginBottom: 20 }} className="fade-up">Orders</h2>

      {/* Summary banner */}
      {summary && (
        <div style={{
          background: 'var(--accent)', borderRadius: 20,
          padding: '20px 22px', color: 'white',
          marginBottom: 20, display: 'flex', gap: 0,
        }} className="fade-up">
          {[
            { label: 'Active Nodes',  value: summary.activeCount },
            { label: 'Total Profit',  value: `${formatETH(summary.totalProfitETH)} ETH` },
            { label: 'Total Orders',  value: summary.totalCount },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ opacity: 0.7, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }} className="fade-up fade-up-1">
        {['all', 'running', 'completed'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>≡</div>
          Loading orders…
        </div>
      ) : visible.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          color: 'var(--text3)', fontSize: 15, lineHeight: 1.7,
        }}>
          {filter === 'all'
            ? 'No orders yet.\nActivate a mining machine to get started.'
            : `No ${filter} orders.`}
        </div>
      ) : visible.map((o, i) => {
        const isRunning = o.status === 'running'
        const progress  = o.progressPct || 0

        return (
          <div key={o._id} className={`order-card fade-up fade-up-${(i % 4) + 1}`}>
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18 }}>
                  {o.machineName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                  #{(o._id || '').slice(-8).toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                  +{formatETH(o.totalProfitETH)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>ETH profit</div>
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text2)' }}>
                Activated {formatDate(o.activatedAt)}
              </span>
              <span>
                <span
                  className="status-dot"
                  style={{
                    background: isRunning ? '#1a6b4a' : '#a09e98',
                    animation: isRunning ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span style={{ fontWeight: 600, color: isRunning ? 'var(--accent)' : 'var(--text3)' }}>
                  {isRunning ? 'Running' : 'Completed'}
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: isRunning
                    ? 'linear-gradient(90deg, var(--accent), #2ecc71)'
                    : 'var(--border)',
                }}
              />
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: 'var(--text3)', marginTop: 6,
            }}>
              <span>{progress}% complete</span>
              <span>Expires {formatDate(o.expiresAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
