import { useState } from 'react'
import { apiPost } from '../api'
import { Scanner } from '../components/Scanner'
import { groupByCategory } from '../categories'
import type { Item, OpenGroup, Person } from '../types'
import { useApi } from '../useApi'

interface Props {
  mode: 'checkout' | 'checkin'
  items: Item[]
  people: Person[]
  refreshKey: number
  onDone: () => void
}

type Feedback = { kind: 'ok' | 'error'; text: string } | null

// Scan or type item IDs into a cart, then check them all out (or in) at once.
export function CartView({ mode, items, people, refreshKey, onDone }: Props) {
  const [cart, setCart] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const [personId, setPersonId] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  // Who currently has each item (used on the check-in screen)
  const open = useApi<OpenGroup[]>('/api/checkouts/open', refreshKey)
  const holderOf = new Map<string, { name: string; since: string }>()
  for (const group of open.data ?? []) {
    for (const item of group.items) holderOf.set(item.id, { name: group.person.name, since: item.checkedOutAt })
  }

  const isCheckout = mode === 'checkout'
  const wantedStatus = isCheckout ? 'IN' : 'OUT'
  const eligible = items.filter((item) => item.status === wantedStatus)
  const byId = new Map(items.map((item) => [item.id, item]))
  const term = filter.trim().toLowerCase()
  const pickable = eligible.filter(
    (item) =>
      !cart.includes(item.id) &&
      (!term || item.id.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)),
  )

  function addToCart(raw: string) {
    const id = raw.trim().toUpperCase().split(' ')[0]
    if (!id) return
    const item = byId.get(id)

    if (!item) return setFeedback({ kind: 'error', text: `${id} is not in the inventory` })
    if (cart.includes(id)) return setFeedback({ kind: 'error', text: `${id} is already in the cart` })
    if (item.status !== wantedStatus) {
      return setFeedback({
        kind: 'error',
        text: isCheckout ? `${id} is already checked out` : `${id} is not checked out`,
      })
    }

    setCart((current) => [...current, id])
    setFeedback({ kind: 'ok', text: `Added ${id} · ${item.name}` })
    navigator.vibrate?.(40)
    setTyped('')
  }

  // Add several items at once (e.g. everything one person has out)
  function addAll(ids: string[]) {
    const fresh = ids.filter((id) => !cart.includes(id))
    if (fresh.length === 0) return
    setCart((current) => [...current, ...fresh])
    setFeedback({ kind: 'ok', text: `Added ${fresh.length} item(s)` })
    navigator.vibrate?.(40)
  }

  async function submit() {
    setSaving(true)
    setFeedback(null)
    try {
      if (isCheckout) {
        await apiPost('/api/checkouts', { personId: Number(personId), itemIds: cart })
        const name = people.find((p) => p.id === Number(personId))?.name
        setFeedback({ kind: 'ok', text: `Checked out ${cart.length} item(s) to ${name}` })
      } else {
        await apiPost('/api/checkins', { itemIds: cart })
        setFeedback({ kind: 'ok', text: `Checked in ${cart.length} item(s)` })
      }
      setCart([])
      setPersonId('')
      onDone()
    } catch (err) {
      setFeedback({ kind: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = cart.length > 0 && (!isCheckout || personId !== '') && !saving

  return (
    <section className="card">
      <h2>{isCheckout ? 'Check out gear' : 'Check in gear'}</h2>
      <p className="hint">Tap gear below, scan a QR label, or type an ID. Everything in the cart is saved in one step.</p>

      <button className="secondary" onClick={() => setCameraOn((on) => !on)}>
        {cameraOn ? 'Stop camera' : 'Scan with camera'}
      </button>
      {cameraOn && <Scanner onScan={addToCart} />}

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          addToCart(typed)
        }}
      >
        <input
          list={`${mode}-ids`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type an ID, e.g. R-A-22"
          autoCapitalize="characters"
        />
        <datalist id={`${mode}-ids`}>
          {eligible.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </datalist>
        <button type="submit">Add</button>
      </form>

      {feedback && <p className={`message ${feedback.kind}`}>{feedback.text}</p>}

      <h3>{isCheckout ? 'Available gear' : 'Who has what'} ({pickable.length})</h3>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={isCheckout ? 'Filter, e.g. sony or battery' : 'Filter by item'} />
      {pickable.length === 0 ? (
        <p className="hint">{eligible.length === 0 ? 'Nothing to show yet.' : 'No matches.'}</p>
      ) : (
        <div className="pick-list">
          {isCheckout
            ? groupByCategory(pickable).map((group) => (
                <div key={group.id}>
                  <h4 className="section-title">
                    {group.label} <span className="count">{group.items.length}</span>
                  </h4>
                  <ul className="list">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button className="pick" onClick={() => addToCart(item.id)}>
                          <span>
                            <strong>{item.id}</strong> {item.name}
                          </span>
                          <span className="add-icon" aria-hidden="true">+</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            : (open.data ?? [])
                .map((group) => ({
                  ...group,
                  items: group.items.filter((item) => pickable.some((p) => p.id === item.id)),
                }))
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.person.id}>
                    <h4 className="section-title person-title">
                      <span>
                        {group.person.name} <span className="count">{group.items.length}</span>
                      </span>
                      <button className="link small" onClick={() => addAll(group.items.map((i) => i.id))}>
                        Add all
                      </button>
                    </h4>
                    <ul className="list">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <button className="pick" onClick={() => addToCart(item.id)}>
                            <span>
                              <strong>{item.id}</strong> {item.name}
                              <span className="sub">since {new Date(item.checkedOutAt).toLocaleString()}</span>
                            </span>
                            <span className="add-icon" aria-hidden="true">+</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
        </div>
      )}

      <h3>Cart ({cart.length})</h3>
      {cart.length === 0 ? (
        <p className="hint">Nothing scanned yet.</p>
      ) : (
        <ul className="list">
          {cart.map((id) => (
            <li key={id}>
              <span>
                <strong>{id}</strong> {byId.get(id)?.name}
                {!isCheckout && holderOf.has(id) && <span className="sub">from {holderOf.get(id)!.name}</span>}
              </span>
              <button className="link" onClick={() => setCart((c) => c.filter((x) => x !== id))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {isCheckout && (
        <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">Who is taking it?</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} ({person.team.toLowerCase()})
            </option>
          ))}
        </select>
      )}

      <button className="primary" disabled={!canSubmit} onClick={submit}>
        {saving ? 'Saving…' : isCheckout ? `Check out ${cart.length} item(s)` : `Check in ${cart.length} item(s)`}
      </button>
    </section>
  )
}
