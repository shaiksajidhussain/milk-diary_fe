import { motion } from 'framer-motion'

export function Skeleton({ className = '' }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 1.4, repeat: Infinity }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card space-y-4 p-6">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}
