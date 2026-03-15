const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function api(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

// ── Wallet / Auth ──────────────────────────────────────────────────────────
export const walletAPI = {
  projectAddress: ()                      => api('/wallet/project-address'),
  challenge:      (walletAddress)         => api('/wallet/challenge', { method: 'POST', body: JSON.stringify({ walletAddress }) }),
  verify:         (walletAddress, signature, message) =>
    api('/wallet/verify', { method: 'POST', body: JSON.stringify({ walletAddress, signature, message }) }),
  me:             (token)                 => api('/wallet/me', {}, token),
  projectBalance: (token)                 => api('/wallet/project-balance', {}, token),
}

// ── Income ─────────────────────────────────────────────────────────────────
export const incomeAPI = {
  collect: (token)              => api('/income/collect', { method: 'POST' }, token),
  history: (token, page = 1)    => api(`/income/history?page=${page}&limit=15`, {}, token),
  summary: (token)              => api('/income/summary', {}, token),
}

// ── Exchange ───────────────────────────────────────────────────────────────
export const exchangeAPI = {
  rate:    ()                           => api('/exchange/rate'),
  preview: (token, ethAmount)           => api('/exchange/preview', { method: 'POST', body: JSON.stringify({ ethAmount }) }, token),
  swap:    (token, ethAmount)           => api('/exchange/swap',    { method: 'POST', body: JSON.stringify({ ethAmount }) }, token),
}

// ── Mining ─────────────────────────────────────────────────────────────────
export const miningAPI = {
  machines: ()                    => api('/mining/machines'),
  activate: (token, machineId)    => api('/mining/activate', { method: 'POST', body: JSON.stringify({ machineId }) }, token),
  orders:   (token, status)       => api(`/mining/orders${status ? `?status=${status}` : ''}`, {}, token),
  summary:  (token)               => api('/mining/summary', {}, token),
}
