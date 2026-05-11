import { motion } from 'framer-motion'

export function WeightDisplay({ liters, label = 'Net volume', unit = 'L' }) {
  const n = Number(liters) || 0
  const text = n > 0 ? n.toFixed(2) : '0.00'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-8 text-center shadow-inner dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
      <motion.div
        className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <p className="relative text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="relative mt-4 flex items-baseline justify-center gap-2">
        <motion.span
          key={text}
          initial={{ opacity: 0.35, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="text-6xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white sm:text-7xl"
        >
          {text}
        </motion.span>
        <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{unit}</span>
      </div>
      <p className="relative mt-3 text-xs text-slate-500 dark:text-slate-400">
        Display simulates a connected floor scale — mock readings for demo.
      </p>
    </div>
  )
}
