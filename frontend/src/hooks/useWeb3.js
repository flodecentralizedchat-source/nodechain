import { useState, useEffect, useCallback } from 'react'
import { walletAPI } from '../utils/api.js'

const TOKEN_KEY = 'nc_token'

export function useWeb3() {
  const [token,      setToken]      = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user,       setUser]       = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error,      setError]      = useState(null)
  const [loading,    setLoading]    = useState(true)

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return }
    walletAPI.me(token)
      .then(d => setUser(d.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Connect wallet ────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      if (!window.ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask.')
      }

      // 1. Request accounts from wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletAddress = accounts[0]

      // 2. Get challenge (also checks 0.001 ETH minimum balance)
      const { challenge } = await walletAPI.challenge(walletAddress)

      // 3. Ask user to sign the challenge message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge, walletAddress],
      })

      // 4. Send signature to backend → get JWT + user data
      const { token: jwt, user: userData } = await walletAPI.verify(walletAddress, signature, challenge)

      localStorage.setItem(TOKEN_KEY, jwt)
      setToken(jwt)
      setUser(userData)
    } catch (err) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }, [])

  // ── Disconnect ────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // ── Refresh user data from backend ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const d = await walletAPI.me(token)
      setUser(d.user)
    } catch (err) {
      console.warn('refreshUser failed:', err.message)
    }
  }, [token])

  return { token, user, connecting, error, loading, connect, disconnect, refreshUser }
}
