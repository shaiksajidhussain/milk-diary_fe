export function formatDate(d) {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(d) {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(d) {
  return `${formatDate(d)} · ${formatTime(d)}`
}

export function formatWeight(kg) {
  if (kg == null || Number.isNaN(kg)) return '—'
  return `${Number(kg).toFixed(2)} L`
}
