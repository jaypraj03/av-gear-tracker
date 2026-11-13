import { useState } from 'react'
import { apiPost } from '../api'
import type { AssistantReply } from '../types'

const EXAMPLES = ['What is checked out right now?', 'Who has the Canon kit?', 'Which Sony batteries are available?']

// Ask questions about the gear in plain English. The server uses an LLM (Gemini or Claude) with
// read-only tools to look up the answer in the database.
export function AssistantView() {
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState<AssistantReply | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)

  async function ask(q: string) {
    if (q.trim().length < 3) return
    setQuestion(q)
    setAsking(true)
    setError(null)
    setReply(null)
    try {
      setReply(await apiPost<AssistantReply>('/api/assistant', { question: q }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAsking(false)
    }
  }

  return (
    <section className="card">
      <h2>Ask about the gear</h2>
      <p className="hint">AI assistant with read-only access to the inventory.</p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          ask(question)
        }}
      >
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Who has the Sony 24-70?" />
        <button type="submit" disabled={asking}>
          Ask
        </button>
      </form>
      <div className="chips">
        {EXAMPLES.map((example) => (
          <button key={example} className="chip" onClick={() => ask(example)} disabled={asking}>
            {example}
          </button>
        ))}
      </div>
      {asking && <p className="hint">Thinking…</p>}
      {error && <p className="message error">{error}</p>}
      {reply && (
        <div className="answer">
          <p>{reply.answer}</p>
          {reply.toolsUsed.length > 0 && <p className="hint">Looked up: {reply.toolsUsed.join(', ')}</p>}
        </div>
      )}
    </section>
  )
}
