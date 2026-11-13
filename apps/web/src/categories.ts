import type { Item } from './types'

// Display sections, in the order they appear on screen.
export const CATEGORIES = [
  { id: 'body', label: 'Camera bodies', types: ['SONY_BODY', 'CANON_BODY'] },
  { id: 'lens', label: 'Lenses', types: ['SONY_LENS', 'CANON_LENS'] },
  { id: 'battery', label: 'Batteries', types: ['SONY_BATTERY', 'CANON_BATTERY'] },
  { id: 'sd', label: 'SD cards', types: ['SD_CARD'] },
  { id: 'other', label: 'Other', types: ['OTHER'] },
] as const

// Split a list of items into sections, skipping empty ones.
export function groupByCategory(items: Item[]) {
  return CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => (category.types as readonly string[]).includes(item.type)),
  })).filter((group) => group.items.length > 0)
}
