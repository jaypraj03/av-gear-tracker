// Seed script: resets the DEV database to the sample data.
// Run with: npm run db:seed --workspace apps/api
// It wipes existing rows first, so never point it at a database with real data.
import { prisma } from '../src/db.js'
import { resetDemoData } from '../src/seedData.js'

if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
  throw new Error('Refusing to seed a production database')
}

resetDemoData(prisma)
  .then(({ items, people }) => console.log(`Seeded ${items} items and ${people} people`))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
