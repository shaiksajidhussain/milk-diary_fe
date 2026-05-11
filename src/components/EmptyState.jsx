import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export function EmptyState({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
        <Inbox className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  )
}
