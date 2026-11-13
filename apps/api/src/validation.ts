import { z } from 'zod'
import { HttpError } from './errors.js'

// A list of item IDs from the cart: trimmed, upper-cased, duplicates removed.
// e.g. [" r-a-22", "R-A-22", "R-E-35"] -> ["R-A-22", "R-E-35"]
const itemIdList = z
  .array(z.string().trim().min(1, 'Item ID cannot be empty'))
  .min(1, 'Add at least one item')
  .max(50, 'A cart can hold at most 50 items')
  .transform((ids) => [...new Set(ids.map((id) => id.toUpperCase()))])

export const checkoutSchema = z.object({
  personId: z.number().int().positive(),
  itemIds: itemIdList,
})

export const checkinSchema = z.object({
  itemIds: itemIdList,
})

// Check `data` against a schema. If it doesn't fit, throw a 400 with a
// readable list of what's wrong; otherwise return the cleaned-up data.
export function parseBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
    )
    throw new HttpError(400, 'Invalid request', problems)
  }
  return result.data
}
