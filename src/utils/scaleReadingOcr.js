/**
 * Pick a plausible scale reading from OCR text (digits / decimals).
 * Tolerant of spaces, newlines, and common OCR noise between digits.
 */
export function extractScaleNumberFromOcrText(text) {
  const raw = String(text || '')
  const compact = raw.replace(/\s+/g, '')
  const sources = [raw, compact, raw.replace(/[^\d.,]/g, '')]

  const candidates = []
  const push = (n) => {
    if (Number.isFinite(n) && n > 0 && n <= 99999) candidates.push(n)
  }

  for (const s of sources) {
    for (const m of s.matchAll(/(\d{1,4})\s*[.,:]\s*(\d{1,3})/g)) {
      push(parseFloat(`${m[1]}.${m[2]}`))
    }
    // OCR often drops the dot: "65 00" or "65 0"
    for (const m of s.matchAll(/\b(\d{1,4})\s+(\d{2})\b/g)) {
      push(parseFloat(`${m[1]}.${m[2]}`))
    }
    for (const m of s.matchAll(/(\d{1,4}\.\d{1,3})/g)) {
      push(parseFloat(m[1]))
    }
    for (const m of s.matchAll(/(\d{1,4},\d{1,3})/g)) {
      push(parseFloat(m[1].replace(',', '.')))
    }
    for (const m of s.matchAll(/(?:^|[^\d.])(\d{4,5})(?:[^\d.]|$)/g)) {
      const n = parseInt(m[1], 10)
      if (n >= 1000 && n <= 99999) push(n / 100)
    }
  }

  if (candidates.length) {
    const decimals = candidates.filter((n) => Math.abs(n - Math.round(n)) > 1e-6)
    const pool = decimals.length ? decimals : candidates
    return Math.max(...pool)
  }

  const ints = [...compact.matchAll(/(\d{2,4})/g)].map((m) => parseInt(m[1], 10))
  const ok = ints.filter((n) => n >= 1000 && n <= 99999)
  if (ok.length) return Math.max(...ok) / 100
  const small = ints.filter((n) => n >= 10 && n <= 999)
  return small.length ? Math.max(...small) : null
}

/**
 * Build several bitmaps that are easier for Tesseract on LED / 7-segment displays.
 */
function buildOcrImageVariants(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const w0 = img.naturalWidth
        const h0 = img.naturalHeight
        if (!w0 || !h0) {
          resolve([dataUrl])
          return
        }

        const targets = [
          { sx: 0, sy: 0, sw: w0, sh: h0, label: 'full' },
          {
            sx: w0 * 0.2,
            sy: h0 * 0.15,
            sw: w0 * 0.6,
            sh: h0 * 0.45,
            label: 'crop',
          },
        ]

        const scale = Math.min(3.5, Math.max(2, 900 / Math.min(w0, h0)))
        const urls = new Set()
        urls.add(dataUrl)

        for (const t of targets) {
          const sw = Math.max(32, Math.floor(t.sw))
          const sh = Math.max(24, Math.floor(t.sh))
          const sx = Math.max(0, Math.floor(t.sx))
          const sy = Math.max(0, Math.floor(t.sy))
          const dw = Math.min(2400, Math.round(sw * scale))
          const dh = Math.min(1600, Math.round(sh * scale))

          const canvas = document.createElement('canvas')
          canvas.width = dw
          canvas.height = dh
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, dw, dh)
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)

          const id = ctx.getImageData(0, 0, dw, dh)
          const d = id.data
          const n = d.length

          // 1) Green / cyan LED emphasis → grayscale
          const led = ctx.createImageData(dw, dh)
          for (let i = 0; i < n; i += 4) {
            const r = d[i]
            const g = d[i + 1]
            const b = d[i + 2]
            const ledness = Math.max(0, g - r) + Math.max(0, g - b)
            const v = Math.min(255, Math.round(g * 0.55 + ledness * 1.4))
            led.data[i] = led.data[i + 1] = led.data[i + 2] = v
            led.data[i + 3] = 255
          }
          ctx.putImageData(led, 0, 0)
          urls.add(canvas.toDataURL('image/png'))

          // 2) Autocontrast on LED grayscale
          const gcopy = ctx.getImageData(0, 0, dw, dh)
          const g = gcopy.data
          let mn = 255
          let mx = 0
          for (let i = 0; i < n; i += 4) {
            const v = g[i]
            if (v < mn) mn = v
            if (v > mx) mx = v
          }
          const range = mx - mn || 1
          for (let i = 0; i < n; i += 4) {
            const v = Math.round(((g[i] - mn) / range) * 255)
            g[i] = g[i + 1] = g[i + 2] = v
          }
          ctx.putImageData(gcopy, 0, 0)
          urls.add(canvas.toDataURL('image/png'))

          // 3) Binary (bright = digit) — threshold from median luminance
          const bin = ctx.getImageData(0, 0, dw, dh)
          const b = bin.data
          const vals = []
          for (let i = 0; i < n; i += 4) vals.push(b[i])
          vals.sort((a, c) => a - c)
          const med = vals[Math.floor(vals.length / 2)] ?? 128
          const thr = Math.min(230, Math.max(40, med + 28))
          let whites = 0
          for (let i = 0; i < n; i += 4) {
            const on = b[i] >= thr ? 255 : 0
            if (on) whites++
            b[i] = b[i + 1] = b[i + 2] = on
          }
          ctx.putImageData(bin, 0, 0)
          urls.add(canvas.toDataURL('image/png'))

          // 4) Invert if page is mostly white (helps dark-on-light noise)
          if (whites / (n / 4) > 0.55) {
            const inv = ctx.getImageData(0, 0, dw, dh)
            const p = inv.data
            for (let i = 0; i < n; i += 4) {
              const v = 255 - p[i]
              p[i] = p[i + 1] = p[i + 2] = v
            }
            ctx.putImageData(inv, 0, 0)
            urls.add(canvas.toDataURL('image/png'))
          }
        }

        resolve([...urls].slice(0, 16))
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Image preprocess failed'))
      }
    }
    img.onerror = () => reject(new Error('Could not load image for OCR'))
    img.src = dataUrl
  })
}

/**
 * Run OCR on scale photo variants; return best suggested reading or null.
 */
export async function suggestReadingFromScaleImage(dataUrl) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  const collected = []

  try {
    const variants = await buildOcrImageVariants(dataUrl)
    const psms = ['7', '6', '8']

    for (const url of variants) {
      for (const psm of psms) {
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          tessedit_char_whitelist: '0123456789.,:- ',
        })
        const {
          data: { text },
        } = await worker.recognize(url)
        collected.push(text)
        // Fast path when a pass clearly sees a decimal display (e.g. 65.00)
        if (/\d{1,3}\s*[.,:]\s*\d{1,3}/.test(text) || /\d{1,3}\.\d{2}\b/.test(text)) {
          const quick = extractScaleNumberFromOcrText(text)
          if (quick != null && quick >= 0.01 && quick <= 99999) return quick
        }
      }
    }

    await worker.setParameters({
      tessedit_pageseg_mode: '3',
      tessedit_char_whitelist: '',
    })
    const {
      data: { text: full },
    } = await worker.recognize(variants[0] || dataUrl)
    collected.push(full)

    return extractScaleNumberFromOcrText(collected.join('\n'))
  } finally {
    try {
      await worker.terminate()
    } catch {
      /* ignore */
    }
  }
}
