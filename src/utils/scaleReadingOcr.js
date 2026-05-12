/**
 * Pick a plausible scale reading from OCR text (digits / decimals).
 * Tolerant of spaces, newlines, and common OCR noise between digits.
 */
export function extractScaleNumberFromOcrText(text) {
  const raw = String(text || '')
  const compact = raw.replace(/\s+/g, '')
  const sources = [raw, compact, raw.replace(/[^\d.,]/g, '')]
  const MAX_PLAUSIBLE_DIRECT_INT = 200

  const decimalCandidates = []
  const integerCandidates = []

  const pushDecimal = (n) => {
    if (Number.isFinite(n) && n > 0 && n <= 99999) decimalCandidates.push(n)
  }

  const pushInteger = (n) => {
    if (Number.isFinite(n) && n > 0 && n <= 99999) integerCandidates.push(n)
  }

  const voteBest = (nums, digits = 2) => {
    const buckets = new Map()
    for (const n of nums) {
      const key = n.toFixed(digits)
      const b = buckets.get(key) || { count: 0, value: n }
      b.count += 1
      b.value = n
      buckets.set(key, b)
    }
    if (!buckets.size) return null
    return [...buckets.values()]
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.value - b.value))[0]
      .value
  }

  for (const s of sources) {
    for (const m of s.matchAll(/(\d{1,4})\s*[.,:]\s*(\d{1,3})/g)) {
      const frac = m[2].slice(0, 2).padEnd(2, '0')
      pushDecimal(parseFloat(`${m[1]}.${frac}`))
    }
    // OCR often drops the dot: "65 00" or "65 0"
    for (const m of s.matchAll(/\b(\d{1,4})\s+(\d{2})\b/g)) {
      pushDecimal(parseFloat(`${m[1]}.${m[2]}`))
    }
    for (const m of s.matchAll(/(\d{1,4}\.\d{1,3})/g)) {
      pushDecimal(parseFloat(m[1]))
    }
    for (const m of s.matchAll(/(\d{1,4},\d{1,3})/g)) {
      pushDecimal(parseFloat(m[1].replace(',', '.')))
    }
    for (const m of s.matchAll(/(?:^|[^\d.])(\d{4,5})(?:[^\d.]|$)/g)) {
      const n = parseInt(m[1], 10)
      if (n >= 1000 && n <= 99999) pushDecimal(n / 100)
    }
    for (const m of s.matchAll(/(?:^|[^\d.])(\d{2,4})(?:[^\d.]|$)/g)) {
      pushInteger(parseInt(m[1], 10))
    }
  }

  if (decimalCandidates.length) {
    return voteBest(decimalCandidates, 2)
  }

  const ints = [...compact.matchAll(/(\d{2,4})/g)].map((m) => parseInt(m[1], 10))
  const ok = ints.filter((n) => n >= 1000 && n <= 99999)
  if (ok.length) return voteBest(ok.map((n) => n / 100), 2)
  const small = integerCandidates.filter((n) => n >= 10 && n <= 999)
  if (!small.length) return null

  // Safety: for LED scales, plain integer OCR (without decimal clues) is noisy.
  // Reject large values like 500 when no decimal-like token was seen.
  const safeSmall = small.filter((n) => n <= MAX_PLAUSIBLE_DIRECT_INT)
  return safeSmall.length ? voteBest(safeSmall, 0) : null
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

        const detectLedDisplayBox = () => {
          const dw = Math.max(160, Math.min(640, w0))
          const dh = Math.max(120, Math.round((h0 * dw) / w0))
          const c = document.createElement('canvas')
          c.width = dw
          c.height = dh
          const cx = c.getContext('2d')
          if (!cx) return null
          cx.drawImage(img, 0, 0, dw, dh)
          const { data } = cx.getImageData(0, 0, dw, dh)

          let minX = dw
          let minY = dh
          let maxX = -1
          let maxY = -1
          let hits = 0

          for (let y = 0; y < dh; y++) {
            for (let x = 0; x < dw; x++) {
              const i = (y * dw + x) * 4
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              const isLedGreen =
                g > 70 &&
                g > r * 1.15 &&
                g > b * 1.1 &&
                g - r > 18 &&
                g - b > 12
              if (!isLedGreen) continue
              hits++
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }

          if (hits < 120 || maxX <= minX || maxY <= minY) return null

          const boxW = maxX - minX + 1
          const boxH = maxY - minY + 1
          if (boxW < 20 || boxH < 10) return null

          const padX = Math.round(boxW * 0.7)
          const padY = Math.round(boxH * 0.9)
          const sx = Math.max(0, minX - padX)
          const sy = Math.max(0, minY - padY)
          const ex = Math.min(dw - 1, maxX + padX)
          const ey = Math.min(dh - 1, maxY + padY)
          const sw = Math.max(24, ex - sx + 1)
          const sh = Math.max(18, ey - sy + 1)

          return {
            sx: (sx / dw) * w0,
            sy: (sy / dh) * h0,
            sw: (sw / dw) * w0,
            sh: (sh / dh) * h0,
            label: 'led-auto',
          }
        }

        const ledTarget = detectLedDisplayBox()
        const targets = [
          ...(ledTarget ? [ledTarget] : []),
          {
            sx: w0 * 0.2,
            sy: h0 * 0.15,
            sw: w0 * 0.6,
            sh: h0 * 0.45,
            label: 'crop',
          },
          { sx: 0, sy: 0, sw: w0, sh: h0, label: 'full' },
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
        // Fast path only when the OCR strongly resembles scale decimals (e.g. 65.00 or 6500).
        if (
          /\d{1,3}\s*[.,:]\s*\d{2}\b/.test(text) ||
          /\b\d{4,5}\b/.test(text) ||
          /\b\d{2}\s+\d{2}\b/.test(text)
        ) {
          const quick = extractScaleNumberFromOcrText(text)
          if (quick != null && quick >= 0.01 && quick <= 200) return quick
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
