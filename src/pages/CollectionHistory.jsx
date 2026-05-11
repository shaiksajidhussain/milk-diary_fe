import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Download, Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { collectionsApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { formatDate, formatTime } from '../utils/format'

const PAGE_SIZE = 10

export function CollectionHistory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalRows, setTotalRows] = useState(0)

  const [query, setQuery] = useState('')
  const [session, setSession] = useState('all')
  const [page, setPage] = useState(1)

  // Fetch from API with server-side pagination + session filter
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          ...(session !== 'all' ? { session } : {}),
        }
        const { items, meta } = await collectionsApi.list(params)
        if (!cancelled) {
          setRows(items)
          setTotalRows(meta?.total ?? items.length)
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load collections')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, session])

  // Client-side search on already-loaded page
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.farmer?.name || r.farmerName || '').toLowerCase().includes(q) ||
        (r.farmer?.farmerCode || r.farmerId || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  function handleRefresh() {
    setPage(1)
    setSession('all')
    setQuery('')
  }

  function exportUi() {
    toast.success('Export — connect CSV endpoint when backend is extended')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Collection history
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Live audit trail from database — server-side pagination.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh} loading={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" onClick={exportUi}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="glass-panel flex flex-col gap-4 p-4 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search farmer name or code (on this page)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select
              className="bg-transparent text-sm font-medium outline-none dark:text-slate-100"
              value={session}
              onChange={(e) => { setSession(e.target.value); setPage(1) }}
            >
              <option value="all">All sessions</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No records"
          description="Try widening filters or clearing search."
          action={<Button type="button" variant="outline" onClick={handleRefresh}>Reset filters</Button>}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Farmer</TH>
              <TH>Code</TH>
              <TH>Date</TH>
              <TH>Time</TH>
              <TH>Weight</TH>
              <TH>Session</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium text-slate-900 dark:text-white">
                  {row.farmer?.name || row.farmerName || '—'}
                </TD>
                <TD className="font-mono text-xs">
                  {row.farmer?.farmerCode || '—'}
                </TD>
                <TD>{formatDate(row.collectedAt || row.createdAt)}</TD>
                <TD>{formatTime(row.collectedAt || row.createdAt)}</TD>
                <TD className="font-mono">{Number(row.weight).toFixed(2)} L</TD>
                <TD>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.session === 'Morning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200'}`}>
                    {row.session}
                  </span>
                </TD>
                <TD>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Completed
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {totalRows > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:flex-row">
          <p>
            Page <span className="font-semibold">{page}</span> of{' '}
            <span className="font-semibold">{totalPages}</span> · {totalRows} total
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <motion.div
              key={page}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="hidden items-center gap-1 sm:flex"
            >
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const pg = i + 1
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                      page === pg
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pg}
                  </button>
                )
              })}
            </motion.div>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
