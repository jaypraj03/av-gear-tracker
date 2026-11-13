// AI gear assistant using tool calling.
// Works with Google Gemini (free tier, GEMINI_API_KEY) or Anthropic Claude
// (ANTHROPIC_API_KEY). Both use the same read-only tools below.
//
// The model never touches the database directly. We give it a short list of
// READ-ONLY tools (functions we wrote). When it wants data, it asks us to run a
// tool; we run it against Postgres and send back the result; then it writes the
// final answer. This keeps the AI safe (no writes, no raw SQL) and testable.
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './db.js'
import { HttpError } from './errors.js'

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-5-5'
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MAX_TOOL_ROUNDS = 5

const SYSTEM_PROMPT = `You are the assistant for an AV gear checkout app used by a video/photo team.
Answer questions about the gear inventory, who has what, and item history.
Always use the tools to look up data; never guess. Keep answers short (1-4 sentences or a short list).
Item IDs look like R-A-22 (R=Rental, M=Mandir, P=Personal). Statuses: IN, OUT, RETIRED.
If a question is not about the gear or team, politely say you can only help with gear questions.`

const tools: Anthropic.Tool[] = [
  {
    name: 'search_items',
    description:
      'Search gear by text (matches item ID or name, e.g. "sony", "battery", "R-A-22") and/or status. Returns matching items with their status.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to search for in item ID or name' },
        status: { type: 'string', enum: ['IN', 'OUT', 'RETIRED'] },
      },
    },
  },
  {
    name: 'get_open_checkouts',
    description:
      'List every item currently checked out, with who has it and when it was checked out.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_item_history',
    description: 'Get the checkout history of one item: who took it, when, and when it came back.',
    input_schema: {
      type: 'object',
      properties: { itemId: { type: 'string', description: 'Item ID, e.g. R-A-22' } },
      required: ['itemId'],
    },
  },
  {
    name: 'list_people',
    description: 'List team members with their team (VIDEO or PHOTO).',
    input_schema: { type: 'object', properties: {} },
  },
]

// Run one tool and return its result as plain data.
async function runTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'search_items': {
      const query = typeof input.query === 'string' ? input.query.trim() : ''
      const status = input.status as 'IN' | 'OUT' | 'RETIRED' | undefined
      return prisma.item.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(query
            ? {
                OR: [
                  { id: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: { id: true, name: true, status: true, ownership: true },
        orderBy: { id: 'asc' },
        take: 50,
      })
    }
    case 'get_open_checkouts': {
      const rows = await prisma.checkoutItem.findMany({
        where: { returnedAt: null },
        include: { item: true, checkout: { include: { person: true } } },
      })
      return rows.map((r) => ({
        itemId: r.item.id,
        itemName: r.item.name,
        person: r.checkout.person.name,
        checkedOutAt: r.checkout.checkedOutAt,
      }))
    }
    case 'get_item_history': {
      const itemId = String(input.itemId ?? '').trim().toUpperCase()
      const rows = await prisma.checkoutItem.findMany({
        where: { itemId },
        include: { checkout: { include: { person: true } } },
        orderBy: { checkout: { checkedOutAt: 'desc' } },
        take: 20,
      })
      return rows.map((r) => ({
        person: r.checkout.person.name,
        checkedOutAt: r.checkout.checkedOutAt,
        returnedAt: r.returnedAt,
      }))
    }
    case 'list_people':
      return prisma.person.findMany({
        where: { active: true },
        select: { name: true, team: true },
        orderBy: { name: 'asc' },
      })
    default:
      return { error: `Unknown tool ${name}` }
  }
}

export function assistantConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY)
}

// Ask a question using whichever AI provider has a key (Gemini first: free tier).
export async function askAssistant(question: string) {
  return process.env.GEMINI_API_KEY ? askGemini(question) : askClaude(question)
}

const TOO_MANY_LOOKUPS = 'That question needed too many lookups. Try asking something more specific.'

// ---------- Claude (Anthropic SDK) ----------
async function askClaude(question: string) {
  const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }]
  const toolsUsed: string[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })

    if (response.stop_reason !== 'tool_use') {
      const answer = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim()
      return { answer: answer || 'Sorry, I could not find an answer.', toolsUsed }
    }

    // The model asked for one or more tools: run each and send results back.
    messages.push({ role: 'assistant', content: response.content })
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      toolsUsed.push(block.name)
      const output = await runTool(block.name, (block.input ?? {}) as Record<string, unknown>)
      results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) })
    }
    messages.push({ role: 'user', content: results })
  }

  return { answer: TOO_MANY_LOOKUPS, toolsUsed }
}

// ---------- Gemini (OpenAI-compatible REST endpoint, plain fetch) ----------
// Same loop as Claude: the model returns `tool_calls`, we run them and reply
// with `tool` messages, until it gives a final text answer.
interface GeminiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
}

async function askGemini(question: string) {
  const messages: GeminiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ]
  const geminiTools = tools.map((tool) => ({
    type: 'function' as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  }))
  const toolsUsed: string[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ model: GEMINI_MODEL, messages, tools: geminiTools, max_tokens: 500 }),
    })
    if (!res.ok) {
      // Full details go to the server log; the visitor gets a short, safe message.
      console.error(`Gemini request failed (${res.status}): ${await res.text()}`)
      const reason =
        res.status === 429
          ? 'the free AI quota is used up for now; try again in a minute'
          : res.status === 403
            ? 'the AI key is not allowed to use Gemini yet'
            : res.status === 404
              ? 'the AI model is not available'
              : 'the AI service returned an error'
      throw new HttpError(502, `AI assistant unavailable: ${reason} (code ${res.status})`)
    }
    const data = (await res.json()) as { choices: { message: GeminiMessage }[] }
    const message = data.choices[0]?.message

    if (!message?.tool_calls?.length) {
      return { answer: message?.content?.trim() || 'Sorry, I could not find an answer.', toolsUsed }
    }

    messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: message.tool_calls })
    for (const call of message.tool_calls) {
      toolsUsed.push(call.function.name)
      let input: Record<string, unknown> = {}
      try {
        input = JSON.parse(call.function.arguments || '{}')
      } catch {
        // bad JSON from the model: run the tool with no arguments
      }
      const output = await runTool(call.function.name, input)
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(output) })
    }
  }

  return { answer: TOO_MANY_LOOKUPS, toolsUsed }
}
