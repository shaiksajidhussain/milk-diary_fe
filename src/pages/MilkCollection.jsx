import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Camera, Save, Trash2, UserCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { QRScanner } from '../components/QRScanner'
import { WeightDisplay } from '../components/WeightDisplay'
import { EmptyState } from '../components/EmptyState'
import { compressImageFileToDataUrl } from '../utils/imageCompress.js'
import { suggestReadingFromScaleImage } from '../utils/scaleReadingOcr.js'

function deriveSession() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : 'Evening'
}

export function MilkCollection() {
  const { farmers, farmersLoading, addCollection } = useData()
  const activeFarmers = useMemo(
    () => farmers.filter((f) => f.status === 'active'),
    [farmers],
  )

  const scalePhotoInputRef = useRef(null)
  const [demoScanning, setDemoScanning] = useState(false)
  const [selected, setSelected] = useState(null)
  const [weightInput, setWeightInput] = useState('')
  const [scalePhotoDataUrl, setScalePhotoDataUrl] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanIndex, setScanIndex] = useState(0)

  const weightNum = useMemo(() => {
    const n = parseFloat(String(weightInput).replace(',', '.'))
    return Number.isFinite(n) ? n : NaN
  }, [weightInput])

  function resetSessionForm() {
    setWeightInput('')
    setScalePhotoDataUrl(null)
  }

  function handleFarmerFromQr(farmer) {
    resetSessionForm()
    setSelected(farmer)
  }

  async function handleDemoScan() {
    if (activeFarmers.length === 0) {
      toast.error('No active farmers — add one first')
      return
    }
    setDemoScanning(true)
    resetSessionForm()
    try {
      await new Promise((r) => setTimeout(r, 600))
      const farmer = activeFarmers[scanIndex % activeFarmers.length]
      setScanIndex((i) => i + 1)
      setSelected(farmer)
      toast.success(`Demo: ${farmer.name}`)
    } finally {
      setDemoScanning(false)
    }
  }

  async function handleScalePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!selected) {
      toast.error('Scan a farmer QR first')
      return
    }
    let dataUrl
    setPhotoBusy(true)
    try {
      dataUrl = await compressImageFileToDataUrl(file)
      setScalePhotoDataUrl(dataUrl)
      toast.success('Photo captured — detecting reading from display…')
    } catch (err) {
      toast.error(err?.message || 'Could not use that image')
      return
    } finally {
      setPhotoBusy(false)
    }

    if (!dataUrl) return

    setOcrBusy(true)
    try {
      const suggested = await suggestReadingFromScaleImage(dataUrl)
      if (suggested != null && Number.isFinite(suggested)) {
        setWeightInput(String(suggested))
        toast.success(`Filled ${suggested} from photo — confirm units (L) before save`)
      } else {
        toast('Could not read digits from the photo — enter liters manually', { icon: 'ℹ️' })
      }
    } catch {
      toast('Could not read digits from the photo — enter liters manually', { icon: 'ℹ️' })
    } finally {
      setOcrBusy(false)
    }
  }

  async function handleSave() {
    if (!selected) {
      toast.error('Scan a farmer QR first')
      return
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      toast.error('Enter a valid weight in liters')
      return
    }
    setSaving(true)
    try {
      await addCollection({
        farmerId: selected.id,
        weight: weightNum,
        session: deriveSession(),
        collectedAt: new Date().toISOString(),
        ...(scalePhotoDataUrl ? { scalePhotoDataUrl } : {}),
      })
      toast.success(`Collection saved — ${weightNum.toFixed(2)} L for ${selected.name}`)
      setSelected(null)
      resetSessionForm()
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
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>
            <span className="font-medium text-slate-800 dark:text-slate-200">Scan the farmer QR</span> on the
            left (same code as on the farmer profile card). Matched details appear in the panel on the right.
          </li>
          <li>
            Optionally <span className="font-medium text-slate-800 dark:text-slate-200">capture a photo</span> of
            the weighing machine display, then <span className="font-medium text-slate-800 dark:text-slate-200">enter liters</span>{' '}
            and save.
          </li>
        </ol>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Step 1 — Identify farmer
          </p>
          <QRScanner
            farmers={farmers}
            onFarmerMatched={handleFarmerFromQr}
            onDemoScan={handleDemoScan}
            disabled={farmersLoading || farmers.length === 0}
            listLoading={farmersLoading}
            demoDisabled={activeFarmers.length === 0}
            demoLoading={demoScanning}
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Step 2 — Details, scale photo, weight
          </p>

          <Card hover>
            <CardHeader
              title="Farmer details"
              subtitle="Filled automatically after a successful scan (matches Farmers → profile QR)."
            />
            {!selected ? (
              <EmptyState
                title="No farmer selected yet"
                description="Use Start camera on the farmer’s printed QR, or Demo scan to try the flow."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                    <UserCircle2 className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                      {selected.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Same fields as the farmer profile modal
                    </p>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:ring-slate-700">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">ID</dt>
                    <dd className="font-mono text-slate-900 dark:text-white">{selected.farmerCode || '—'}</dd>
                  </div>
                  <div className="rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:ring-slate-700">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">QR payload</dt>
                    <dd className="font-mono text-xs text-slate-900 dark:text-white">{selected.qrCode || '—'}</dd>
                  </div>
                  <div className="rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:ring-slate-700">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mobile</dt>
                    <dd className="text-slate-900 dark:text-white">{selected.mobile}</dd>
                  </div>
                  <div className="rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:ring-slate-700">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Village</dt>
                    <dd className="text-slate-900 dark:text-white">{selected.village}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold capitalize text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200">
                      Status: {selected.status}
                    </div>
                  </div>
                </dl>
              </motion.div>
            )}
          </Card>

          <Card hover>
            <CardHeader
              title="Weighing machine"
              subtitle="Photo is optional. After capture we try to read digits from the display and fill liters below (verify — LED fonts can misread)."
            />
            <input
              ref={scalePhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleScalePhotoChange}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                className="sm:max-w-xs"
                disabled={!selected || photoBusy || ocrBusy}
                loading={photoBusy || ocrBusy}
                onClick={() => scalePhotoInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Capture scale photo
              </Button>
              {scalePhotoDataUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="sm:ml-0"
                  onClick={() => setScalePhotoDataUrl(null)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove photo
                </Button>
              ) : null}
            </div>
            {scalePhotoDataUrl ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950/40 dark:border-slate-700">
                <img
                  src={scalePhotoDataUrl}
                  alt="Weighing machine"
                  className="max-h-56 w-full object-contain"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                On phones, this opens the camera. On desktop, you can pick an image file.
              </p>
            )}
          </Card>

          <Input
            label="Liters collected"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 12.5"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            disabled={!selected}
            hint="Auto-filled from the photo when possible; always confirm (e.g. scale may show kg while you store liters)."
          />

          <WeightDisplay liters={Number.isFinite(weightNum) && weightNum > 0 ? weightNum : 0} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              loading={saving}
              disabled={!selected || !Number.isFinite(weightNum) || weightNum <= 0}
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
