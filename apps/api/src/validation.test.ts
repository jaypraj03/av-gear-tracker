import { describe, expect, it } from 'vitest'
import { HttpError } from './errors.js'
import { checkinSchema, checkoutSchema, parseBody } from './validation.js'

describe('checkoutSchema', () => {
  it('cleans item IDs: trims, upper-cases, and removes duplicates', () => {
    const body = parseBody(checkoutSchema, {
      personId: 2,
      itemIds: [' r-a-22', 'R-A-22', 'r-e-35 '],
    })
    expect(body).toEqual({ personId: 2, itemIds: ['R-A-22', 'R-E-35'] })
  })

  it('rejects an empty cart with a 400', () => {
    expect(() => parseBody(checkoutSchema, { personId: 2, itemIds: [] })).toThrow(HttpError)
    try {
      parseBody(checkoutSchema, { personId: 2, itemIds: [] })
    } catch (err) {
      expect((err as HttpError).status).toBe(400)
    }
  })

  it('rejects a person ID that is not a positive whole number', () => {
    expect(() => parseBody(checkoutSchema, { personId: 'abc', itemIds: ['R-A-22'] })).toThrow(HttpError)
    expect(() => parseBody(checkoutSchema, { personId: -1, itemIds: ['R-A-22'] })).toThrow(HttpError)
  })

  it('rejects carts over 50 items', () => {
    const itemIds = Array.from({ length: 51 }, (_, i) => `R-A-${i}`)
    expect(() => parseBody(checkoutSchema, { personId: 1, itemIds })).toThrow(HttpError)
  })
})

describe('checkinSchema', () => {
  it('accepts a list of item IDs', () => {
    expect(parseBody(checkinSchema, { itemIds: ['m-x-62'] })).toEqual({ itemIds: ['M-X-62'] })
  })

  it('rejects a missing itemIds field', () => {
    expect(() => parseBody(checkinSchema, {})).toThrow(HttpError)
  })
})
