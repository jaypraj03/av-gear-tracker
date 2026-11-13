import { Router } from 'express'
import { prisma } from '../db.js'

export const peopleRouter = Router()

// GET /api/people -> active team members, sorted by name
peopleRouter.get('/', async (_req, res) => {
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })

  res.json(people)
})
