import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Gauge, Save, UserCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { QRScannerMock } from '../components/QRScannerMock'
import { WeightDisplay } from '../components/WeightDisplay'
import { EmptyState } from '../components/EmptyState'

function deriveSession() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : 'Evening'
}

function randomWeight() {
  return Math.round((6 + Math.random() * 12) * 10) / 10
}

export function MilkCollection() {
  const { farmers, addCollection } = useData()
  const activeFarmers = useMemo(
    () => farmers.filter((f) => f.status === 'active'),
    [farmers],
  )

  const [scanning, setScanning] = useState(false)
  const [selected, setSelected] = useState(null)
  const [weight, setWeight] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scanIndex, setScanIndex] = useState(0)

  async function handleScan() {
    if (activeFarmers.length === 0) {
      toast.error('No active farmers — add one first')
      return
    }
    setScanning(true)
    setWeight(null)
    await new Promise((r) => setTimeout(r, 900))
    const farmer = activeFarmers[scanIndex % activeFarmers.length]
    setScanIndex((i) => i + 1)
    setSelected(farmer)
    setScanning(false)
    toast.success(`QR matched — ${farmer.name}`)
  }

  function handleCaptureWeight() {
    if (!selected) {
      toast.error('Scan a farmer QR first')
      return
    }
    const w = randomWeight()
    setWeight(w)
    toast('Weight captured from scale (mock)', { icon: '⚖️' })
  }

  async function handleSave() {
    if (!selected || weight == null) {
      toast.error('Scan farmer and capture weight before saving')
      return
    }
    setSaving(true)
    try {
      await addCollection({
        farmerId: selected.id,
        weight,
        session: deriveSession(),
        collectedAt: new Date().toISOString(),
      })
      toast.success(`Collection saved — ${weight.toFixed(2)} L for ${selected.name}`)
      setSelected(null)
      setWeight(null)
    } catch (err) {
      toast.error(err.message || 'Failed to save collection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Milk collection
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Scan farmer QR → capture weight → save to database.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <QRScannerMock
          onScan={handleScan}
          scanning={scanning}
          disabled={activeFarmers.length === 0}
        />

        <div className="space-y-4">
          <Card hover>
            <CardHeader title="Farmer details" subtitle="Populated after QR scan" />
            {!selected ? (
              <EmptyState
                title="Waiting for scan"
                description="Use Scan QR to load a farmer profile into this lane."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {selected.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {selected.farmerCode || selected.id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="rounded-full bg-white/80 px-2 py-0.5 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
                      {selected.mobile}
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
                      {selected.village}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold capitalize text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200">
                      {selected.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>

          <WeightDisplay liters={weight ?? 0} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleCaptureWeight}
              disabled={!selected}
            >
              <Gauge className="h-4 w-4" />
              Capture weight
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              loading={saving}
              disabled={!selected || weight == null}
            >
              <Save className="h-4 w-4" />
              Save to database
            </Button>
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Session: <span className="font-semibold">{deriveSession()}</span> · auto-detected from clock
          </p>
        </div>
      </div>
    </div>
  )
}
