import { Router } from 'express'
import { z } from 'zod'
import { askAssistant, assistantConfigured } from '../assistant.js'
import { HttpError } from '../errors.js'
import { rateLimit } from '../rateLimit.js'
import { parseBody } from '../validation.js'

export const assistantRouter = Router()

const questionSchema = z.object({
  question: z.string().trim().min(3, 'Ask a longer question').max(300, 'Keep questions under 300 characters'),
})

// POST /api/assistant  Body: { "question": "Who has the Sony 24-70?" }
// Limited to 20 questions per hour per visitor to cap AI costs on the public demo.
assistantRouter.post('/', rateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  if (!assistantConfigured()) {
    throw new HttpError(503, 'The AI assistant is not configured on this server')
  }
  const { question } = parseBody(questionSchema, req.body)
  res.json(await askAssistant(question))
})
