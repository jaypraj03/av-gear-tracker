import { Router } from 'express'
import { prisma } from '../db.js'
import { ItemStatus } from '../generated/prisma/enums.js'

export const itemsRouter = Router()

// GET /api/items
// Optional query params:
//   ?status=IN|OUT|RETIRED  -> only items with that status
//   ?search=sony            -> items whose ID or name contains the text
itemsRouter.get('/', async (req, res) => {
  const { status, search } = req.query

  // Reject unknown status values instead of silently returning nothing.
  if (status !== undefined && !Object.values(ItemStatus).includes(status as ItemStatus)) {
    res.status(400).json({ message: `status must be one of: ${Object.values(ItemStatus).join(', ')}` })
    return
  }

  const items = await prisma.item.findMany({
    where: {
      ...(status ? { status: status as ItemStatus } : {}),
      ...(typeof search === 'string' && search.trim()
        ? {
            OR: [
              { id: { contains: search.trim(), mode: 'insensitive' } },
              { name: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { id: 'asc' },
  })

  res.json(items)
})

// GET /api/items/:id -> one item, or 404 if it doesn't exist
itemsRouter.get('/:id', async (req, res) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id } })

  if (!item) {
    res.status(404).json({ message: `Item ${req.params.id} not found` })
    return
  }

  res.json(item)
})
