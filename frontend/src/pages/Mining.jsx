import { useState, useEffect } from 'react'
import { miningAPI } from '../utils/api.js'
import { formatETH, formatUSD } from '../utils/format.js'

export default function MiningPage({ token, userEthBalance, onRefresh }) {
  const [machines, setMachines] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [states,   setStates]   = useState({}) // per-machine { loading, msg }

  useEffect(() => {
    miningAPI.machines()
      .then(d => setMachines(d.machines || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleActivate = async (machine) => {
    setStates(s => ({ ...s, [machine.id]: { loading: true, msg: null } }))
    try {
      await miningAPI.activate(token, machine.id)
      setStates(s => ({ ...s, [machine.id]: { loading: false, msg: { type: 'success', text: `${machine.name} activated! Check Orders tab.` } } }))
      onRefresh()
    } catch (err) {
      setStates(s => ({ ...s, [machine.id]: { loading: false, msg: { type: 'error', text: err.message } } }))
    }
  }

  const balance = userEthBalance || 0

  return (
    <div style={{ padding: '28px 20px 100px' }}>
      <style>{`
        .machine-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 22px; margin-bottom: 16px;
          box-shadow: var(--shadow); transition: transform 0.2s, box-shadow 0.2s;
        }
        .machine-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .return-bar {
          padding: 10px 14px; background: var(--surface2);
          border-radius: 10px; font-size: 13px; color: var(--text2);
          margin-top: 12px;
        }
      `}</style>

      <h2 style={{ fontSize: 26, marginBottom: 4 }} className="fade-up">Mining Nodes</h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }} className="fade-up fade-up-1">
        Balance: <strong style={{ color: 'var(--accent)' }}>{formatETH(balance)} ETH</strong>
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>⬡</div>
          Loading machines…
        </div>
      ) : machines.map((m, i) => {
        const st         = states[m.id] || {}
        const canAfford  = balance >= m.price
        const activated  = st.msg?.type === 'success'

        return (
          <div key={m.id} className={`machine-card fade-up fade-up-${(i % 4) + 1}`}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, marginBottom: 4 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.hashrate}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: 'var(--accent)' }}>
                  {m.price} ETH
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {m.priceUSD ? formatUSD(m.priceUSD, 0) : ''}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 4 }}>
              <span className="tag" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                📈 {m.dailyReturnPct}% daily
              </span>
              <span className="tag" style={{ background: '#fef8ef', color: 'var(--accent2)' }}>
                ⏱ {m.durationDays} days
              </span>
              <span className="tag" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                ⬡ {m.hashrate}
              </span>
            </div>

            {/* Return estimate */}
            <div className="return-bar">
              Est. total return:&nbsp;
              <strong style={{ color: 'var(--accent)' }}>
                {m.totalReturn ? formatETH(m.totalReturn) : '—'} ETH
              </strong>
              &nbsp;over {m.durationDays} days
            </div>

            {/* CTA */}
            {activated ? (
              <div className="msg-box success" style={{ marginTop: 14, textAlign: 'center' }}>
                ✓ &nbsp;Node is active — check Orders
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 14, ...((!canAfford || st.loading) && { opacity: 0.5, cursor: 'not-allowed' }) }}
                  disabled={st.loading || !canAfford}
                  onClick={() => handleActivate(m)}
                >
                  {st.loading
                    ? 'Activating…'
                    : !canAfford
                      ? `Need ${m.price} ETH (you have ${formatETH(balance)})`
                      : `Activate — ${m.price} ETH`}
                </button>
                {st.msg?.type === 'error' && (
                  <div className="msg-box error">✕ &nbsp;{st.msg.text}</div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
