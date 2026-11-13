// Sample data for the dev database and the public demo.
// Used by prisma/seed.ts and by POST /api/demo/reset.
import type { PrismaClient } from './generated/prisma/client.js'

// IDs follow the label scheme: <ownership>-<type>-<number>
//   ownership: R = Rental, M = Mandir, P = Personal
//   type: A = Sony body, E = Sony lens, N = Sony battery,
//         C = Canon body, K = Canon lens, T = Canon battery, X = SD card
//   number: digits 2-9 only (no 0 or 1, which look like O and I)
export const sampleItems = [
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

// Fake names only: the repo and the demo are public.
export const samplePeople = [
  { name: 'Alex Patel', team: 'VIDEO' },
  { name: 'Jordan Lee', team: 'VIDEO' },
  { name: 'Sam Rivera', team: 'VIDEO' },
  { name: 'Taylor Shah', team: 'PHOTO' },
  { name: 'Morgan Kim', team: 'PHOTO' },
  { name: 'Riley Desai', team: 'PHOTO' },
] as const

// Wipe all tables and reload the sample data, so the demo starts fresh.
// A few items start checked out, so the "still out" screen has something to show.
export async function resetDemoData(db: PrismaClient) {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE checkout_items, checkouts, people, items RESTART IDENTITY CASCADE',
  )
  await db.item.createMany({ data: [...sampleItems] })
  await db.person.createMany({ data: [...samplePeople] })

  // Person 4 (Taylor Shah) has a Canon kit out; person 1 (Alex Patel) has an SD card.
  const startOut = [
    { personId: 4, itemIds: ['M-C-22', 'M-K-35', 'M-T-42'] },
    { personId: 1, itemIds: ['M-X-62'] },
  ]
  for (const { personId, itemIds } of startOut) {
    await db.checkout.create({
      data: { personId, items: { create: itemIds.map((itemId) => ({ itemId })) } },
    })
    await db.item.updateMany({ where: { id: { in: itemIds } }, data: { status: 'OUT' } })
  }

  return { items: sampleItems.length, people: samplePeople.length }
}
