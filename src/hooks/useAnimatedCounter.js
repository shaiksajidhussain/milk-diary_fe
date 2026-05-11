import { useEffect, useState } from 'react'

export function useAnimatedCounter(endValue, { duration = 1200, decimals = 0 } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame
    const start = performance.now()
    const from = 0
    const to = Number(endValue) || 0

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      setValue(decimals > 0 ? current : Math.round(current))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [endValue, duration, decimals])

  const display =
    decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(value))

  return display
}
