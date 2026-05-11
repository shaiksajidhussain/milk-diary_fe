import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, Droplets, Sun, Moon, Activity, Sparkles, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useAnimatedCounter } from '../hooks/useAnimatedCounter'
import { Card, CardHeader } from '../components/ui/Card'
import { StatCard } from '../components/StatCard'
import { CollectionChart } from '../components/CollectionChart'
import { SkeletonCard } from '../components/Skeleton'
import { Button } from '../components/ui/Button'
import { formatDate, formatTime } from '../utils/format'

export function Dashboard() {
  const { user } = useAuth()
  const {
    dashboardStats,
    chartSeries,
    recentActivity,
    dashboardLoading,
    farmersLoading,
    collectionsLoading,
    fetchDashboard,
    fetchCollections,
  } = useData()

  const loading = dashboardLoading || farmersLoading || collectionsLoading

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const farmersCount = useAnimatedCounter(dashboardStats.totalFarmers)
  const todayCount = useAnimatedCounter(dashboardStats.todayCollectionCount)
  const todayLiters = useAnimatedCounter(dashboardStats.todayLiters, { decimals: 1 })
  const morning = useAnimatedCounter(dashboardStats.morningTodayLiters, { decimals: 1 })
  const evening = useAnimatedCounter(dashboardStats.eveningTodayLiters, { decimals: 1 })

  async function handleRefresh() {
    await Promise.all([fetchDashboard(), fetchCollections()])
  }

  if (loading && dashboardStats.totalFarmers === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel relative overflow-hidden p-6 md:p-8"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Live operations overview
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {greeting}, {user?.name || 'Admin'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
              Track pour sessions, farmer throughput, and today&apos;s intake — live from the database.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-2xl border border-white/40 bg-white/60 px-5 py-4 text-sm shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Today</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatDate(new Date())}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(new Date())}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRefresh} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-1">
          <StatCard title="Total farmers" value={farmersCount} subtitle={`${dashboardStats.activeFarmers} active`} icon={Users} delay={0.02} accent="emerald" />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Today's collections" value={todayCount} subtitle="Recorded pours" icon={Activity} delay={0.06} accent="sky" />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Total milk today" value={`${todayLiters} L`} subtitle="All sessions" icon={Droplets} delay={0.1} accent="amber" />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Morning session" value={`${morning} L`} subtitle="Before noon" icon={Sun} delay={0.14} accent="violet" />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Evening session" value={`${evening} L`} subtitle="After noon" icon={Moon} delay={0.18} accent="emerald" />
        </div>
      </div>

      {/* Chart + activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" hover>
          <CardHeader title="Collection trend" subtitle="Rolling 7-day liters received" />
          <CollectionChart labels={chartSeries.labels} values={chartSeries.values} />
        </Card>

        <Card hover>
          <CardHeader title="Recent activity" subtitle="Latest saved entries" />
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No entries yet today.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item, idx) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="flex items-center justify-between rounded-xl border border-slate-100/80 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatTime(item.time)}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Top farmers today */}
      <Card hover>
        <CardHeader title="Today's top farmers" subtitle="Ranked by liters contributed today" />
        {dashboardStats.topFarmersToday.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No collections yet today.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardStats.topFarmersToday.map((row, i) => (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                whileHover={{ y: -2 }}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Farmer</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  {Number(row.liters).toFixed(1)} L
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
