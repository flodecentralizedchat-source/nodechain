import { useState, useEffect, useCallback } from 'react'
import { incomeAPI, exchangeAPI } from '../utils/api.js'
import { formatCountdown, formatETH, formatUSD, formatDateTime } from '../utils/format.js'

const BASE_INCOME = 0.0082
const INTERVAL_S  = 6 * 60 * 60   // 6 hours in seconds

export default function AccountPage({ user, ethPrice, token, onRefresh }) {
  const [timer,    setTimer]    = useState(user.secondsUntilIncome ?? INTERVAL_S)
  const [ethAmt,   setEthAmt]   = useState('')
  const [history,  setHistory]  = useState([])
  const [histLoad, setHistLoad] = useState(true)

  const [collectState, setCollectState] = useState({ loading: false, msg: null })
  const [swapState,    setSwapState]    = useState({ loading: false, msg: null })

  // ── Countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    setTimer(user.secondsUntilIncome ?? INTERVAL_S)
  }, [user.secondsUntilIncome])

  useEffect(() => {
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Load history ─────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const d = await incomeAPI.history(token)
      setHistory(d.records || [])
    } catch {}
    finally { setHistLoad(false) }
  }, [token])

  useEffect(() => { loadHistory() }, [loadHistory])

  // ── Collect income ────────────────────────────────────────────────────
  const handleCollect = async () => {
    setCollectState({ loading: true, msg: null })
    try {
      const d = await incomeAPI.collect(token)
      setCollectState({ loading: false, msg: { type: 'success', text: `+${d.ethAmount} ETH collected (${formatUSD(d.usdValue)})` } })
      onRefresh()
      loadHistory()
    } catch (err) {
      setCollectState({ loading: false, msg: { type: 'error', text: err.message } })
    }
  }

  // ── Swap ETH → USDT ───────────────────────────────────────────────────
  const handleSwap = async () => {
    const amt = parseFloat(ethAmt)
    if (!amt || amt <= 0) return
    setSwapState({ loading: true, msg: null })
    try {
      const d = await exchangeAPI.swap(token, amt)
      setSwapState({ loading: false, msg: { type: 'success', text: `Swapped ${d.ethSwapped} ETH → ${formatUSD(d.usdtReceived)}` } })
      setEthAmt('')
      onRefresh()
    } catch (err) {
      setSwapState({ loading: false, msg: { type: 'error', text: err.message } })
    }
  }

  const usdtPreview = ethAmt && ethPrice ? (parseFloat(ethAmt) * ethPrice).toFixed(2) : ''
  const arcPct      = 1 - timer / INTERVAL_S
  const canCollect  = timer === 0

  return (
    <div style={{ padding: '28px 20px 100px' }}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }} className="fade-up">Account</h2>

      {/* ── Income timer ── */}
      <div className="card fade-up">
        <div className="section-label">Pending Income</div>

        {/* Circular arc */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
          <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - arcPct)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: 'var(--accent)' }}>
              {formatCountdown(timer)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>next drop</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: 'var(--accent)' }}>
            +{BASE_INCOME} ETH
          </span>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>
          {ethPrice ? `≈ ${formatUSD(BASE_INCOME * ethPrice)}` : ''}
        </div>

        <button
          className={`btn ${canCollect ? 'btn-primary' : 'btn-light'}`}
          onClick={handleCollect}
          disabled={collectState.loading || !canCollect}
        >
          {collectState.loading
            ? 'Processing…'
            : canCollect
              ? 'Collect Income'
              : `Available in ${formatCountdown(timer)}`}
        </button>

        {collectState.msg && (
          <div className={`msg-box ${collectState.msg.type}`}>
            {collectState.msg.type === 'success' ? '✓' : '✕'} &nbsp;{collectState.msg.text}
          </div>
        )}
      </div>

      {/* ── ETH → USDT Exchange ── */}
      <div className="card fade-up fade-up-1">
        <div className="section-label">ETH → USDT Exchange</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Live rate</span>
          <span style={{ fontWeight: 600, color: 'var(--accent2)' }}>
            {ethPrice ? `1 ETH = $${ethPrice.toLocaleString()}` : 'Loading…'}
          </span>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
            You send (ETH) — Available: {formatETH(user.ethBalance)}
          </div>
          <input
            className="input-field"
            type="number" placeholder="0.000" min="0.0001" step="0.001"
            value={ethAmt}
            onChange={e => setEthAmt(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>You receive (USDT)</div>
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'var(--accent-light)', color: 'var(--accent)',
            fontWeight: 600, fontSize: 20,
          }}>
            {usdtPreview ? `$${usdtPreview}` : '—'}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSwap}
          disabled={swapState.loading || !ethAmt || parseFloat(ethAmt) <= 0 || parseFloat(ethAmt) > (user.ethBalance || 0)}
        >
          {swapState.loading ? 'Processing…' : 'Exchange Now'}
        </button>

        {swapState.msg && (
          <div className={`msg-box ${swapState.msg.type}`}>
            {swapState.msg.type === 'success' ? '✓' : '✕'} &nbsp;{swapState.msg.text}
          </div>
        )}
      </div>

      {/* ── Income history ── */}
      <div className="card fade-up fade-up-2">
        <div className="section-label">Income History</div>
        {histLoad ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 14 }}>
            No income records yet
          </div>
        ) : history.map((h, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0',
            borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>+{formatETH(h.ethAmount)} ETH</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {formatDateTime(h.distributedAt)}
              </div>
            </div>
            <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
              +{formatUSD(h.usdValue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
