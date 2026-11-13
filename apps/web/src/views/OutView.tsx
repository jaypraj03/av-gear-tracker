import type { OpenGroup } from '../types'
import { useApi } from '../useApi'

// Everything currently checked out, grouped by person.
export function OutView({ refreshKey }: { refreshKey: number }) {
  const { data, error, loading } = useApi<OpenGroup[]>('/api/checkouts/open', refreshKey)

  return (
    <section className="card">
      <h2>Still out</h2>
      {loading && <p className="hint">Loading…</p>}
      {error && <p className="message error">{error}</p>}
      {data?.length === 0 && <p className="hint">Everything is checked in.</p>}
      {data?.map((group) => (
        <div key={group.person.id} className="group">
          <h3>
            {group.person.name} <span className="count">{group.items.length}</span>
          </h3>
          <ul className="list">
            {group.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.id}</strong> {item.name}
                </span>
                <span className="hint">since {new Date(item.checkedOutAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
