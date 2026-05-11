import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a real scannable QR for the given string (not a decorative icon).
 */
export function QrCodeImage({ value, size = 200, className = '' }) {
  const [dataUrl, setDataUrl] = useState('')
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    const text = String(value || '').trim()

    if (!text) {
      queueMicrotask(() => {
        if (!cancelled) {
          setDataUrl('')
          setErr(null)
        }
      })
      return () => {
        cancelled = true
      }
    }

    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#047857', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) {
          setErr(null)
          setDataUrl(url)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e?.message || 'QR failed')
          setDataUrl('')
        }
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!String(value || '').trim()) return null
  if (err) {
    return <p className="text-center text-xs text-rose-600 dark:text-rose-400">{err}</p>
  }
  if (!dataUrl) {
    return (
      <div
        className={`mx-auto animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }
  return (
    <img
      src={dataUrl}
      alt={`QR code: ${value}`}
      width={size}
      height={size}
      className={`mx-auto rounded-xl bg-white p-2 shadow-md ring-1 ring-slate-200/80 dark:ring-slate-600 ${className}`}
    />
  )
}
