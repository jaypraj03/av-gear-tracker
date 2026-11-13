// Seed script: fills the DEV database with sample gear and people for testing.
// Run with: npm run db:seed --workspace apps/api
// It wipes existing rows first, so never point it at a real database.
import { prisma } from '../src/db.js'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed: NODE_ENV is production')
}

// IDs follow the label scheme: <ownership>-<type>-<number>
//   ownership: R = Rental, M = Mandir, P = Personal
//   type: A = Sony body, E = Sony lens, N = Sony battery,
//         C = Canon body, K = Canon lens, T = Canon battery, X = SD card
//   number: digits 2-9 only (no 0 or 1, which look like O and I)
const items = [
  { id: 'R-A-22', name: 'Sony A7 IV body', ownership: 'RENTAL', type: 'SONY_BODY' },
  { id: 'R-A-23', name: 'Sony FX3 body', ownership: 'RENTAL', type: 'SONY_BODY' },
  { id: 'R-E-35', name: 'Sony 24-70mm f/2.8 GM II', ownership: 'RENTAL', type: 'SONY_LENS' },
  { id: 'R-E-36', name: 'Sony 70-200mm f/2.8 GM II', ownership: 'RENTAL', type: 'SONY_LENS' },
  { id: 'R-N-47', name: 'Sony NP-FZ100 battery', ownership: 'RENTAL', type: 'SONY_BATTERY' },
  { id: 'R-N-48', name: 'Sony NP-FZ100 battery', ownership: 'RENTAL', type: 'SONY_BATTERY' },
  { id: 'M-A-22', name: 'Sony A7S III body', ownership: 'MANDIR', type: 'SONY_BODY' },
  { id: 'M-E-24', name: 'Sony 16-35mm f/4 G', ownership: 'MANDIR', type: 'SONY_LENS' },
  { id: 'M-C-22', name: 'Canon EOS R6 Mark II body', ownership: 'MANDIR', type: 'CANON_BODY' },
  { id: 'M-K-35', name: 'Canon RF 24-105mm f/4L', ownership: 'MANDIR', type: 'CANON_LENS' },
  { id: 'M-T-42', name: 'Canon LP-E6NH battery', ownership: 'MANDIR', type: 'CANON_BATTERY' },
  { id: 'M-X-62', name: 'SanDisk 128GB SD card', ownership: 'MANDIR', type: 'SD_CARD' },
  { id: 'M-X-63', name: 'SanDisk 128GB SD card', ownership: 'MANDIR', type: 'SD_CARD' },
  { id: 'P-X-93', name: 'Lexar 64GB SD card', ownership: 'PERSONAL', type: 'SD_CARD' },
] as const

// Fake names for the demo (never commit real team members' names to a public repo)
const people = [
  { name: 'Alex Patel', team: 'VIDEO' },
  { name: 'Jordan Lee', team: 'VIDEO' },
  { name: 'Sam Rivera', team: 'VIDEO' },
  { name: 'Taylor Shah', team: 'PHOTO' },
  { name: 'Morgan Kim', team: 'PHOTO' },
  { name: 'Riley Desai', team: 'PHOTO' },
] as const

async function main() {
  // Empty every table and reset the auto-numbering, so people are always
  // ids 1-6 after seeding. CASCADE also clears rows that point at these tables.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE checkout_items, checkouts, people, items RESTART IDENTITY CASCADE',
  )

  await prisma.item.createMany({ data: [...items] })
  await prisma.person.createMany({ data: [...people] })

  console.log(`Seeded ${items.length} items and ${people.length} people`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
