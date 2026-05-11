import { motion } from 'framer-motion'

export function CollectionChart({ labels, values }) {
  const max = Math.max(1, ...values)
  const maxPx = 168

  return (
    <div className="mt-6">
      <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
        {values.map((v, i) => {
          const px = Math.max(8, Math.round((v / max) * maxPx))
          return (
            <div key={labels[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <motion.div
                className="w-full max-w-[2.75rem] rounded-t-xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-600/25 dark:from-emerald-500 dark:to-teal-400/90"
                initial={{ height: 0 }}
                animate={{ height: px }}
                transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                {labels[i]}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>7-day collection (L)</span>
        <span>Peak {Math.max(...values)} L</span>
      </div>
    </div>
  )
}
