import { useState } from 'react'
import { LabelImage } from '../components/LabelImage'
import { DPI_OPTIONS, downloadDataUrl, LABEL_SIZES, renderLabel, type LabelSize } from '../labelImage'
import type { Item } from '../types'

// Printable QR labels in common sizes. Download PNGs for a label-maker app
// (Niimbot, Brother, etc.) or print directly at true size.
export function LabelsView({ items }: { items: Item[] }) {
  const [sizeId, setSizeId] = useState('niimbot')
  const [customW, setCustomW] = useState(40)
  const [customH, setCustomH] = useState(14)
  const [dpi, setDpi] = useState(203)
  const [busy, setBusy] = useState(false)

  const size: LabelSize =
    sizeId === 'custom'
      ? { id: 'custom', label: 'Custom', widthMm: customW, heightMm: customH }
      : LABEL_SIZES.find((s) => s.id === sizeId)!

  async function downloadAll() {
    setBusy(true)
    for (const item of items) {
      const url = await renderLabel(item.id, item.name, size, dpi)
      downloadDataUrl(url, `${item.id}_${size.id}_${dpi}dpi.png`)
      await new Promise((r) => setTimeout(r, 250)) // space out downloads so the browser accepts them
    }
    setBusy(false)
  }

  return (
    <section className="card">
      <div className="no-print">
        <h2>QR labels</h2>
        <p className="hint">Pick a size, then download PNGs for your label printer's app, or print this page.</p>

        <div className="label-controls">
          <label>
            Label size
            <select value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
              {LABEL_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
              <option value="custom">Custom size…</option>
            </select>
          </label>

          {sizeId === 'custom' && (
            <div className="row">
              <label>
                Width (mm)
                <input type="number" min={10} max={150} value={customW} onChange={(e) => setCustomW(Number(e.target.value) || 10)} />
              </label>
              <label>
                Height (mm)
                <input type="number" min={8} max={150} value={customH} onChange={(e) => setCustomH(Number(e.target.value) || 8)} />
              </label>
            </div>
          )}

          <label>
            Printer resolution
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
              {DPI_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="row">
          <button className="secondary" onClick={downloadAll} disabled={busy || items.length === 0}>
            {busy ? 'Downloading…' : `Download all ${items.length} PNGs`}
          </button>
          <button className="secondary" onClick={() => window.print()}>
            Print
          </button>
        </div>
        <p className="hint">
          Tip: Chrome may ask to allow multiple downloads the first time. When printing, set scale to 100% (no "fit to
          page") so labels come out at true size.
        </p>
      </div>

      <div className="labels">
        {items.map((item) => (
          <LabelImage key={item.id} id={item.id} name={item.name} size={size} dpi={dpi} />
        ))}
      </div>
    </section>
  )
}
