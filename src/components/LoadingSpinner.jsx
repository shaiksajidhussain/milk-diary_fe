import { motion } from 'framer-motion'

export function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <motion.div
        className="h-12 w-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-600"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
