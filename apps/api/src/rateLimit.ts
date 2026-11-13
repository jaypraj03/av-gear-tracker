import type { NextFunction, Request, Response } from 'express'

// A tiny in-memory rate limiter: at most `max` requests per IP per window.
// Protects paid or destructive endpoints (the AI assistant, demo reset) on a
// public demo. Memory resets when the server restarts, which is fine here.
export function rateLimit({ max, windowMs }: { max: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }
    if (entry.count >= max) {
      const minutes = Math.ceil((entry.resetAt - now) / 60000)
      res.status(429).json({ message: `Too many requests. Try again in ${minutes} min.` })
      return
    }
    entry.count++
    next()
  }
}
