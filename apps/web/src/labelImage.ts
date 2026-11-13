import QRCode from 'qrcode'

export interface LabelSize {
  id: string
  label: string
  widthMm: number
  heightMm: number
}

// Common label sizes. Tape sizes are the printable strip for label makers
// (e.g. Niimbot, Brother P-touch); "in" sizes are standard sticker sheets/rolls.
export const LABEL_SIZES: LabelSize[] = [
  { id: 'tape12', label: '12 mm tape (12 × 32 mm)', widthMm: 32, heightMm: 12 },
  { id: 'niimbot', label: 'Niimbot 14 × 40 mm', widthMm: 40, heightMm: 14 },
  { id: 'tape24', label: '24 mm tape (24 × 60 mm)', widthMm: 60, heightMm: 24 },
  { id: 'sticker1x2', label: 'Sticker 1 × 2 in', widthMm: 50.8, heightMm: 25.4 },
  { id: 'square1', label: 'Square 1 × 1 in', widthMm: 25.4, heightMm: 25.4 },
  { id: 'square2', label: 'Square 2 × 2 in', widthMm: 50.8, heightMm: 50.8 },
]

export const DPI_OPTIONS = [
  { value: 203, label: '203 DPI (most thermal label printers)' },
  { value: 300, label: '300 DPI (high-res / inkjet / laser)' },
]

const mmToPx = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi)

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Largest font size (px) at which `text` fits in maxWidth, capped at maxSize.
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: string,
  maxWidth: number,
  maxSize: number,
  family = 'ui-monospace, Menlo, Consolas, monospace',
) {
  let size = maxSize
  while (size > 6) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 1
  }
  return size
}

// Draw one label (QR code + ID, and the name when there's room) at the exact
// physical size and return it as a PNG data URL.
export async function renderLabel(id: string, name: string, size: LabelSize, dpi: number) {
  const width = mmToPx(size.widthMm, dpi)
  const height = mmToPx(size.heightMm, dpi)
  const margin = Math.round(Math.min(width, height) * 0.08)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'middle'

  const square = width / height < 1.4

  if (square) {
    // QR on top, ID (and name) underneath
    const textBand = Math.round(height * 0.3)
    const qrSize = Math.min(width - margin * 2, height - margin * 2 - textBand)
    const qr = await loadImage(await QRCode.toDataURL(id, { margin: 0, width: qrSize, errorCorrectionLevel: 'M' }))
    ctx.drawImage(qr, (width - qrSize) / 2, margin, qrSize, qrSize)

    ctx.textAlign = 'center'
    const textTop = margin + qrSize
    const showName = true // always print the item description
    const idSize = fitFont(ctx, id, '700', width - margin * 2, Math.round(textBand * (showName ? 0.5 : 0.75)))
    ctx.font = `700 ${idSize}px ui-monospace, Menlo, Consolas, monospace`
    ctx.fillText(id, width / 2, textTop + (showName ? textBand * 0.35 : textBand / 2))
    if (showName) {
      const nameSize = fitFont(ctx, name, '600', width - margin * 2, Math.round(textBand * 0.3), 'system-ui, sans-serif')
      ctx.font = `600 ${nameSize}px system-ui, sans-serif`
      ctx.fillText(name, width / 2, textTop + textBand * 0.75)
    }
  } else {
    // QR on the left, ID (and name) to the right
    const qrSize = height - margin * 2
    const qr = await loadImage(await QRCode.toDataURL(id, { margin: 0, width: qrSize, errorCorrectionLevel: 'M' }))
    ctx.drawImage(qr, margin, margin, qrSize, qrSize)

    ctx.textAlign = 'left'
    const textX = margin * 2 + qrSize
    const textWidth = width - textX - margin
    const showName = true // always print the item description
    const idSize = fitFont(ctx, id, '700', textWidth, Math.round(height * 0.36))
    ctx.font = `700 ${idSize}px ui-monospace, Menlo, Consolas, monospace`
    ctx.fillText(id, textX, height * 0.34)
    if (showName) {
      const nameSize = fitFont(ctx, name, '600', textWidth, Math.round(height * 0.2), 'system-ui, sans-serif')
      ctx.font = `600 ${nameSize}px system-ui, sans-serif`
      ctx.fillText(name, textX, height * 0.72)
    }
  }

  return canvas.toDataURL('image/png')
}

// Save a data URL as a file.
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
