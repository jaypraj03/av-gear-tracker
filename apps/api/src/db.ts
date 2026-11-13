// One shared database connection for the whole API.
// Each PrismaClient opens a pool of connections, so we create it ONCE here
// and import `prisma` everywhere else instead of making new clients.
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add it to apps/api/.env')
}

// The adapter connects Prisma to Postgres through the `pg` driver.
const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({ adapter })
