import { MapPin, Phone, BadgeCheck } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

const statusStyles = {
  active: 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200',
  inactive: 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20 dark:text-slate-300',
}

export function FarmerCard({ farmer, onViewProfile, onShowHistory }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{farmer.name}</p>
          <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
            {farmer.farmerCode || farmer.id}
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
          <Phone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {farmer.mobile}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {farmer.village}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <BadgeCheck className="h-4 w-4" />
        Verified profile
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1 min-w-[100px]" onClick={onViewProfile}>
          View
        </Button>
        <Button type="button" size="sm" variant="secondary" className="flex-1 min-w-[100px]" onClick={onShowHistory}>
          Show detailed
        </Button>
      </div>
    </Card>
  )
}
