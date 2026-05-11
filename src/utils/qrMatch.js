export function normalizeQrText(text) {
  let s = String(text || '').trim()
  s = s.replace(/\s+/g, '')
  s = s.replace(/-{2,}/g, '-')
  return s
}

/** Pull likely farmer codes from a URL or noisy scan (e.g. …/farmer/FARMER-1001?x=1) */
function candidateStrings(text) {
  const raw = String(text || '').trim()
  const out = []
  const push = (s) => {
    const n = normalizeQrText(s)
    if (n && !out.includes(n)) out.push(n)
  }
  push(raw)
  const upper = raw.toUpperCase()
  const mFarmer = upper.match(/FARMER-\d+/i)
  if (mFarmer) push(mFarmer[0])
  const mFr = raw.match(/FR-\d+/i)
  if (mFr) push(mFr[0])
  const uuid = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)
  if (uuid) push(uuid[0])
  return out
}

/**
 * Match decoded QR text to a farmer (backend uses qrCode like FARMER-1001, farmerCode FR-1001).
 */
export function findFarmerByQrText(farmers, text) {
  if (!farmers?.length) return null

  const norm = (v) => (v ? normalizeQrText(v) : '')

  const tryToken = (token) => {
    const raw = normalizeQrText(token)
    if (!raw) return null
    const lower = raw.toLowerCase()

    const byExact = farmers.find((f) => {
      const candidates = [f.qrCode, f.farmerCode, f.id, f.qrPayload].filter(Boolean)
      return candidates.some((c) => norm(c) === raw || norm(c).toLowerCase() === lower)
    })
    if (byExact) return byExact

    return (
      farmers.find((f) => {
        const q = norm(f.qrCode).toLowerCase()
        const c = norm(f.farmerCode).toLowerCase()
        return (
          (q && lower.includes(q)) ||
          (c && lower.includes(c)) ||
          (f.qrCode && raw.includes(norm(f.qrCode)))
        )
      }) || null
    )
  }

  for (const token of candidateStrings(text)) {
    const hit = tryToken(token)
    if (hit) return hit
  }
  return null
}
