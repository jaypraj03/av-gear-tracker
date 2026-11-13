// Small wrapper around fetch for talking to our Express API.
// VITE_API_URL is set at build time (e.g. on Render); locally it defaults to port 3000.
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Turn the API's error body into one readable sentence.
function describeError(body: { message?: string; details?: unknown }) {
  const message = body.message ?? 'Request failed'
  const details = body.details
  if (Array.isArray(details)) return `${message}: ${details.join('; ')}`
  if (details && typeof details === 'object') {
    const lists = Object.values(details).filter(Array.isArray).flat()
    if (lists.length > 0) return `${message}: ${lists.join(', ')}`
  }
  return message
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. It may be waking up; try again in 30 seconds.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, describeError(body))
  return body as T
}

export const apiGet = <T>(path: string) => request<T>(path)

export const apiPost = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) })
