import { useEffect, useState } from 'react'
import { downloadDataUrl, renderLabel, type LabelSize } from '../labelImage'

interface Props {
  id: string
  name: string
  size: LabelSize
  dpi: number
}

// Preview of one label at its exact print size, with a PNG download button.
// On paper (print), the image is sized in millimetres so it prints true to size.
export function LabelImage({ id, name, size, dpi }: Props) {
  const [src, setSrc] = useState<string>()

  useEffect(() => {
    let cancelled = false
    renderLabel(id, name, size, dpi).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [id, name, size, dpi])

  return (
    <div className="label-card">
      {src && (
        <img
          className="label-img"
          src={src}
          alt={`Label ${id}`}
          style={{ width: `${size.widthMm}mm`, height: `${size.heightMm}mm` }}
        />
      )}
      <button
        className="link small no-print"
        disabled={!src}
        onClick={() => src && downloadDataUrl(src, `${id}_${size.id}_${dpi}dpi.png`)}
      >
        Download PNG
      </button>
    </div>
  )
}
