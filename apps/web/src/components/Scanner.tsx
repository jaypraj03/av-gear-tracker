import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onScan: (text: string) => void
}

// Live camera view that reads QR codes and calls onScan with the text.
// Uses the back camera on phones. Ignores the same code repeated within 2 seconds,
// so holding the camera on one label doesn't add it over and over.
export function Scanner({ onScan }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState<string | null>(null)

  // Always call the latest onScan without restarting the camera.
  useEffect(() => {
    onScanRef.current = onScan
  })

  useEffect(() => {
    if (!window.isSecureContext) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
      setError('The camera only works over HTTPS. Use the live demo link, or type IDs below.')
      return
    }

    // Give each camera session its own element, so React's double-mount in
    // development never makes two scanners fight over one element.
    const host = document.createElement('div')
    host.id = `qr-${Math.random().toString(36).slice(2)}`
    containerRef.current?.appendChild(host)

    const scanner = new Html5Qrcode(host.id)
    let started = false
    let stopped = false
    let lastText = ''
    let lastAt = 0

    const stop = () => {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => host.remove())
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          const now = Date.now()
          if (text === lastText && now - lastAt < 2000) return
          lastText = text
          lastAt = now
          onScanRef.current(text)
        },
        () => {}, // "no code in this frame" - ignore
      )
      .then(() => {
        started = true
        if (stopped) stop()
      })
      .catch(() => {
        setError('Could not open the camera. Allow camera access, or type IDs below.')
        host.remove()
      })

    return () => {
      stopped = true
      if (started) stop()
    }
  }, [])

  return (
    <div>
      <div ref={containerRef} className="scanner" />
      {error && <p className="message error">{error}</p>}
    </div>
  )
}
