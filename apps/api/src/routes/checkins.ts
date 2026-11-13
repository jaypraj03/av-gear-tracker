import { Router } from 'express'
import { prisma } from '../db.js'
import { HttpError } from '../errors.js'
import { checkinSchema, parseBody } from '../validation.js'

export const checkinsRouter = Router()

// POST /api/checkins
// Body: { "itemIds": ["R-A-22", "R-E-35"] }
// Returns items to inventory, all-or-nothing. Works even if the items came
// from different checkouts or people.
checkinsRouter.post('/', async (req, res) => {
  const { itemIds } = parseBody(checkinSchema, req.body)

  const returned = await prisma.$transaction(async (tx) => {
    // Find the open (not yet returned) checkout row for each item.
    const openRows = await tx.checkoutItem.findMany({
      where: { itemId: { in: itemIds }, returnedAt: null },
    })

    const openIds = new Set(openRows.map((row) => row.itemId))
    const notOut = itemIds.filter((id) => !openIds.has(id))
    if (notOut.length > 0) {
      throw new HttpError(409, 'Some items are not checked out', { notOut })
    }

    const now = new Date()
    await tx.checkoutItem.updateMany({
      where: { itemId: { in: itemIds }, returnedAt: null },
      data: { returnedAt: now },
    })
    await tx.item.updateMany({
      where: { id: { in: itemIds } },
      data: { status: 'IN' },
    })

    return tx.item.findMany({ where: { id: { in: itemIds } }, orderBy: { id: 'asc' } })
  })

  res.json({ returned })
})
