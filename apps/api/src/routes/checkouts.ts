import { Router } from 'express'
import { prisma } from '../db.js'
import { HttpError } from '../errors.js'
import { checkoutSchema, parseBody } from '../validation.js'

export const checkoutsRouter = Router()

// POST /api/checkouts
// Body: { "personId": 2, "itemIds": ["R-A-22", "R-E-35"] }
// Checks out every item in the cart to one person, all-or-nothing.
checkoutsRouter.post('/', async (req, res) => {
  const { personId, itemIds } = parseBody(checkoutSchema, req.body)

  // Everything inside $transaction succeeds together or is rolled back together.
  // Throwing an error anywhere inside cancels ALL the changes.
  const checkout = await prisma.$transaction(async (tx) => {
    const person = await tx.person.findUnique({ where: { id: personId } })
    if (!person || !person.active) {
      throw new HttpError(404, `Person ${personId} not found`)
    }

    const items = await tx.item.findMany({ where: { id: { in: itemIds } } })

    const foundIds = new Set(items.map((item) => item.id))
    const missing = itemIds.filter((id) => !foundIds.has(id))
    if (missing.length > 0) {
      throw new HttpError(404, 'Some items do not exist', { missing })
    }

    const unavailable = items.filter((item) => item.status !== 'IN').map((item) => item.id)
    if (unavailable.length > 0) {
      throw new HttpError(409, 'Some items are not available', { unavailable })
    }

    // Mark items OUT, but ONLY those still IN. If two people scan the same item
    // at the same moment, only one update succeeds; the other sees a smaller
    // count, throws, and its whole transaction rolls back.
    const updated = await tx.item.updateMany({
      where: { id: { in: itemIds }, status: 'IN' },
      data: { status: 'OUT' },
    })
    if (updated.count !== itemIds.length) {
      throw new HttpError(409, 'Some items were just checked out by someone else')
    }

    return tx.checkout.create({
      data: {
        personId,
        items: { create: itemIds.map((itemId) => ({ itemId })) },
      },
      include: { person: true, items: { include: { item: true } } },
    })
  })

  res.status(201).json(checkout)
})

// GET /api/checkouts/open
// Everything currently checked out, grouped by person.
checkoutsRouter.get('/open', async (_req, res) => {
  const openRows = await prisma.checkoutItem.findMany({
    where: { returnedAt: null },
    include: { item: true, checkout: { include: { person: true } } },
    orderBy: { checkout: { checkedOutAt: 'asc' } },
  })

  // Group rows into one entry per person.
  const byPerson = new Map<
    number,
    { person: { id: number; name: string }; items: { id: string; name: string; checkedOutAt: Date }[] }
  >()

  for (const row of openRows) {
    const { person } = row.checkout
    if (!byPerson.has(person.id)) {
      byPerson.set(person.id, { person: { id: person.id, name: person.name }, items: [] })
    }
    byPerson.get(person.id)!.items.push({
      id: row.item.id,
      name: row.item.name,
      checkedOutAt: row.checkout.checkedOutAt,
    })
  }

  res.json([...byPerson.values()])
})
