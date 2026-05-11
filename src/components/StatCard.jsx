import { motion } from 'framer-motion'
import { Card } from './ui/Card'

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay = 0,
  accent = 'emerald',
}) {
  const accents = {
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300',
    sky: 'from-sky-500/20 to-blue-500/10 text-sky-700 dark:text-sky-300',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-800 dark:text-amber-200',
    violet: 'from-violet-500/20 to-purple-500/10 text-violet-700 dark:text-violet-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative overflow-hidden">
        <div
          className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${accents[accent]}`}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </p>
            {subtitle ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          {Icon ? (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  )
}
