import { useState, useEffect, useCallback } from 'react'
import { exchangeAPI } from '../utils/api.js'

export function useEthPrice() {
  const [price,   setPrice]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchPrice = useCallback(async () => {
    try {
      const d = await exchangeAPI.rate()
      setPrice(d.ethUsd)
      setError(null)
    } catch {
      // Direct CoinGecko fallback if backend is unreachable
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        const j = await r.json()
        setPrice(j.ethereum?.usd || 2000)
      } catch {
        setError('Could not fetch price')
        if (!price) setPrice(2000) // last resort
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrice()
    // Refresh every 60 seconds
    const id = setInterval(fetchPrice, 60_000)
    return () => clearInterval(id)
  }, [fetchPrice])

  return { price, loading, error, refresh: fetchPrice }
}
