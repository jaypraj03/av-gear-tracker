import { useState } from 'react'
import { groupByCategory } from '../categories'
import type { Item } from '../types'

// Full inventory with a search box and status badges.
export function InventoryView({ items }: { items: Item[] }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const shown = items.filter(
    (item) => !term || item.id.toLowerCase().includes(term) || item.name.toLowerCase().includes(term),
  )

  return (
    <section className="card">
      <h2>Inventory</h2>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID or name" />
      <p className="hint">
        {items.filter((i) => i.status === 'IN').length} in · {items.filter((i) => i.status === 'OUT').length} out
      </p>
      {shown.length === 0 && <p className="hint">No matches.</p>}
      {groupByCategory(shown).map((group) => (
        <div key={group.id}>
          <h3 className="section-title">
            {group.label} <span className="count">{group.items.length}</span>
          </h3>
          <ul className="list">
            {group.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.id}</strong> {item.name}
                </span>
                <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
