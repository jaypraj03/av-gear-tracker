import { useState } from 'react'
import './App.css'
import { apiPost } from './api'
import type { Item, Person } from './types'
import { useApi } from './useApi'
import { AssistantView } from './views/AssistantView'
import { CartView } from './views/CartView'
import { InventoryView } from './views/InventoryView'
import { LabelsView } from './views/LabelsView'
import { OutView } from './views/OutView'

const TABS = [
  { id: 'checkout', label: 'Check out' },
  { id: 'checkin', label: 'Check in' },
  { id: 'out', label: 'Still out' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'ask', label: 'Ask AI' },
  { id: 'labels', label: 'Labels' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('checkout')
  // Bumping refreshKey makes every screen reload its data from the API.
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  const items = useApi<Item[]>('/api/items', refreshKey)
  const people = useApi<Person[]>('/api/people', refreshKey)

  async function resetDemo() {
    if (!window.confirm('Restore the sample data? This clears all checkouts.')) return
    try {
      await apiPost('/api/demo/reset')
      refresh()
    } catch (err) {
      window.alert((err as Error).message)
    }
  }

  const allItems = items.data ?? []
  const allPeople = people.data ?? []

  return (
    <div className="app">
      <header className="header no-print">
        <div className="brand">
          <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="2" y="9" width="28" height="19" rx="5" fill="currentColor" />
            <path d="M11 9l2.2-4h5.6L21 9" fill="currentColor" />
            <circle cx="16" cy="18.5" r="6" fill="var(--card)" />
            <circle cx="16" cy="18.5" r="3.2" fill="currentColor" />
          </svg>
          <div>
            <h1>AV Gear Tracker</h1>
            <p className="tagline">Equipment check-in and check-out</p>
          </div>
        </div>
      </header>

      <nav className="tabs no-print">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {items.loading && <p className="hint center">Loading…</p>}
      {items.error && <p className="message error">{items.error}</p>}

      <main>
        {tab === 'checkout' && <CartView key="checkout" mode="checkout" items={allItems} people={allPeople} refreshKey={refreshKey} onDone={refresh} />}
        {tab === 'checkin' && <CartView key="checkin" mode="checkin" items={allItems} people={allPeople} refreshKey={refreshKey} onDone={refresh} />}
        {tab === 'out' && <OutView refreshKey={refreshKey} />}
        {tab === 'inventory' && <InventoryView items={allItems} />}
        {tab === 'ask' && <AssistantView />}
        {tab === 'labels' && <LabelsView items={allItems} />}
      </main>

      <footer className="footer no-print">
        <span>© {new Date().getFullYear()} AV Gear Tracker</span>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/jaypraj03/av-gear-tracker">GitHub</a>
        <span aria-hidden="true">·</span>
        <button className="link small" onClick={resetDemo}>
          Reset sample data
        </button>
      </footer>
    </div>
  )
}

export default App
