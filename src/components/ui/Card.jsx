import { motion } from 'framer-motion'

export function Card({ children, className = '', glass = true, hover = true, ...props }) {
  const base = glass ? 'glass-card' : 'rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`${base} p-5 md:p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
