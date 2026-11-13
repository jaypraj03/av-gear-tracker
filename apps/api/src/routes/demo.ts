import { Router } from 'express'
import { prisma } from '../db.js'
import { HttpError } from '../errors.js'
import { rateLimit } from '../rateLimit.js'
import { resetDemoData } from '../seedData.js'

export const demoRouter = Router()

// POST /api/demo/reset -> restore the sample data (only when DEMO_MODE=true)
demoRouter.post('/reset', rateLimit({ max: 10, windowMs: 60 * 60 * 1000 }), async (_req, res) => {
  if (process.env.DEMO_MODE !== 'true') {
    throw new HttpError(403, 'Demo reset is turned off')
  }
  const counts = await resetDemoData(prisma)
  res.json({ message: 'Demo data restored', ...counts })
})
