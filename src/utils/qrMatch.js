function normalizeQrText(text) {
  return String(text || '').trim()
}

/**
 * Match decoded QR text to a farmer (backend uses qrCode like FARMER-1001, farmerCode FR-1001).
 */
export function findFarmerByQrText(farmers, text) {
  const raw = normalizeQrText(text)
  if (!raw || !farmers?.length) return null
  const lower = raw.toLowerCase()

  const byExact = farmers.find(
    (f) =>
      f.qrCode === raw ||
      f.farmerCode === raw ||
      f.id === raw ||
      f.qrPayload === raw,
  )
  if (byExact) return byExact

  const byLower = farmers.find(
    (f) =>
      (f.qrCode && f.qrCode.toLowerCase() === lower) ||
      (f.farmerCode && f.farmerCode.toLowerCase() === lower),
  )
  if (byLower) return byLower

  return (
    farmers.find((f) => {
      const q = (f.qrCode || '').toLowerCase()
      const c = (f.farmerCode || '').toLowerCase()
      return (q && lower.includes(q)) || (c && lower.includes(c)) || (f.qrCode && raw.includes(f.qrCode))
    }) || null
  )
}
