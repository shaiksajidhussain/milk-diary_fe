import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, QrCode, RefreshCw, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { FarmerCard } from '../components/FarmerCard'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'

export function Farmers() {
  const { farmers, farmersLoading, addFarmer, updateFarmer, removeFarmer, fetchFarmers } = useData()

  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', mobile: '', village: '', status: 'active' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return farmers
    return farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.farmerCode || f.id).toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        (f.mobile || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    )
  }, [farmers, query])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim() || !form.village.trim()) {
      toast.error('Fill in name, mobile, and village')
      return
    }
    setSubmitting(true)
    try {
      const created = await addFarmer(form)
      toast.success(`Farmer ${created.name} added`)
      setAddOpen(false)
      setForm({ name: '', mobile: '', village: '', status: 'active' })
    } catch (err) {
      toast.error(err.message || 'Failed to add farmer')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(farmer) {
    try {
      const next = farmer.status === 'active' ? 'inactive' : 'active'
      await updateFarmer(farmer.id, { status: next })
      toast.success(`${farmer.name} marked ${next}`)
      if (detail?.id === farmer.id) setDetail((d) => ({ ...d, status: next }))
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  async function handleDelete(farmer) {
    if (!window.confirm(`Delete ${farmer.name}? This cannot be undone.`)) return
    try {
      await removeFarmer(farmer.id)
      toast.success(`${farmer.name} removed`)
      setDetail(null)
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Farmers</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Register members, verify contacts, and preview QR identifiers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => fetchFarmers()} loading={farmersLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add farmer
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-10"
          placeholder="Search by name, code, village, or mobile"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 lg:hidden">
        {farmersLoading && farmers.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No farmers found"
            description="Try a different search or add a new farmer."
            action={<Button type="button" variant="outline" onClick={() => setQuery('')}>Clear search</Button>}
          />
        ) : (
          filtered.map((f) => <FarmerCard key={f.id} farmer={f} onClick={() => setDetail(f)} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        {farmersLoading && farmers.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No farmers match" description="Adjust filters or add a farmer." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Farmer</TH>
                <TH>Code</TH>
                <TH>Mobile</TH>
                <TH>Village</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((f) => (
                <TR key={f.id}>
                  <TD className="font-medium text-slate-900 dark:text-white">{f.name}</TD>
                  <TD className="font-mono text-xs">{f.farmerCode || f.id}</TD>
                  <TD>{f.mobile}</TD>
                  <TD>{f.village}</TD>
                  <TD>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${f.status === 'active' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {f.status}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setDetail(f)}>
                        View
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(f)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Farmer profile">
        {detail ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{detail.name}</p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{detail.farmerCode || detail.id}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Mobile · {detail.mobile}</p>
                <p>Village · {detail.village}</p>
                <p className="capitalize">Status · {detail.status}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-emerald-400/50 bg-white/80 p-6 text-center dark:bg-slate-900/40">
              <QrCode className="mx-auto h-16 w-16 text-emerald-700 dark:text-emerald-300" />
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">QR payload</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                {detail.qrCode || detail.qrPayload || detail.farmerCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleToggleStatus(detail)}
              >
                Mark {detail.status === 'active' ? 'inactive' : 'active'}
              </Button>
              <Button type="button" variant="danger" onClick={() => handleDelete(detail)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        ) : null}
      </Modal>

      {/* Add farmer modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add farmer" size="md">
        <form className="space-y-4" onSubmit={handleAdd}>
          <Input
            label="Full name"
            required
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Mobile (+91XXXXXXXXXX)"
            required
            value={form.mobile}
            placeholder="+919876543210"
            onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))}
          />
          <Input
            label="Village"
            required
            value={form.village}
            onChange={(e) => setForm((s) => ({ ...s, village: e.target.value }))}
          />
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Save farmer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
