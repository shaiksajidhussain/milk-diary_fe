import { motion } from 'framer-motion'
import { MapPin, Phone, BadgeCheck } from 'lucide-react'
import { Card } from './ui/Card'

const statusStyles = {
  active: 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200',
  inactive: 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20 dark:text-slate-300',
}

export function FarmerCard({ farmer, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left"
    >
      <Card className="h-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{farmer.name}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
              {farmer.id}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[farmer.status] || statusStyles.inactive}`}
          >
            {farmer.status}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {farmer.mobile}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {farmer.village}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Verified profile
        </div>
      </Card>
    </motion.button>
  )
}
