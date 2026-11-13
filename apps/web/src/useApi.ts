import { useEffect, useState } from 'react'
import { apiGet } from './api'

interface State<T> {
  data?: T
  error?: string
  loading: boolean
}

// Load data from a GET endpoint. Changing `refreshKey` loads it again
// (we bump it after a checkout or check-in so every screen stays current).
export function useApi<T>(path: string, refreshKey: number): State<T> {
  const [state, setState] = useState<State<T>>({ loading: true })

  useEffect(() => {
    let cancelled = false // ignore late responses after the screen changes
    apiGet<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ error: err.message, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [path, refreshKey])

  return state
}
