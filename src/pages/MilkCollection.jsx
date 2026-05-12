import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Camera, CameraOff, ImagePlus, Save, Trash2, UserCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { QRScanner } from '../components/QRScanner'
import { WeightDisplay } from '../components/WeightDisplay'
import { EmptyState } from '../components/EmptyState'
import { compressImageFileToDataUrl } from '../utils/imageCompress.js'
import { suggestReadingFromScaleImage } from '../utils/scaleReadingOcr.js'
import { ocrApi } from '../services/api.js'

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

  const scalePhotoCameraInputRef = useRef(null)
  const scalePhotoUploadInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [demoScanning, setDemoScanning] = useState(false)
  const [selected, setSelected] = useState(null)
  const [weightInput, setWeightInput] = useState('')
  const [scalePhotoDataUrl, setScalePhotoDataUrl] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [cameraCaptureOpen, setCameraCaptureOpen] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
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

  const stopCameraStream = () => {
    const stream = streamRef.current
    streamRef.current = null
    if (!stream) return
    for (const track of stream.getTracks()) track.stop()
  }

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [])

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

  async function processScalePhotoDataUrl(dataUrl, sourceLabel = 'captured') {
    if (!dataUrl) return
    setScalePhotoDataUrl(dataUrl)
    toast.success(`Photo ${sourceLabel} — detecting reading from display…`)
    setOcrBusy(true)
    try {
      let aiSuggested = null
      try {
        const ai = await ocrApi.readScaleFromImage(dataUrl)
        if (ai?.value != null && Number.isFinite(ai.value)) {
          aiSuggested = ai.value
        }
      } catch {
        /* fallback to local OCR */
      }

      if (aiSuggested != null) {
        setWeightInput(String(aiSuggested))
        toast.success(`Filled ${aiSuggested} from AI photo read — confirm units (L) before save`)
        return
      }

      const localSuggested = await suggestReadingFromScaleImage(dataUrl)
      if (localSuggested != null && Number.isFinite(localSuggested)) {
        setWeightInput(String(localSuggested))
        toast.success(`Filled ${localSuggested} from photo — confirm units (L) before save`)
      } else {
        toast('Could not read digits from the photo — enter liters manually', { icon: 'ℹ️' })
      }
    } catch {
      toast('Could not read digits from the photo — enter liters manually', { icon: 'ℹ️' })
    } finally {
      setOcrBusy(false)
    }
  }

  async function handleScalePhotoChange(e, source = 'captured') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!selected) {
      toast.error('Scan a farmer QR first')
      return
    }
    setPhotoBusy(true)
    try {
      const dataUrl = await compressImageFileToDataUrl(file)
      await processScalePhotoDataUrl(dataUrl, source)
    } catch (err) {
      toast.error(err?.message || 'Could not use that image')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function openCameraCapture() {
    if (!selected || photoBusy || ocrBusy || cameraStarting) return
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error('Camera API is not available in this browser')
      return
    }
    setCameraStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setCameraCaptureOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    } catch (err) {
      toast.error(err?.message || 'Could not access camera. Check browser permissions.')
      stopCameraStream()
    } finally {
      setCameraStarting(false)
    }
  }

  function closeCameraCapture() {
    setCameraCaptureOpen(false)
    stopCameraStream()
  }

  async function handleTakeSnapshot() {
    const video = videoRef.current
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      toast.error('Camera not ready yet')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Could not capture image')
      return
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    closeCameraCapture()
    await processScalePhotoDataUrl(dataUrl, 'captured')
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
              ref={scalePhotoCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleScalePhotoChange(e, 'captured')}
            />
            <input
              ref={scalePhotoUploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleScalePhotoChange(e, 'uploaded')}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                className="sm:max-w-xs"
                disabled={!selected || photoBusy || ocrBusy}
                loading={cameraStarting || photoBusy || ocrBusy}
                onClick={openCameraCapture}
              >
                <Camera className="h-4 w-4" />
                Capture from camera
              </Button>
              <Button
                type="button"
                variant="outline"
                className="sm:max-w-xs"
                disabled={!selected || photoBusy || ocrBusy}
                onClick={() => scalePhotoUploadInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Upload existing photo
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
                Use camera for live capture, or upload an already saved scale image.
              </p>
            )}
          </Card>

          {cameraCaptureOpen ? (
            <Card hover>
              <CardHeader
                title="Camera capture"
                subtitle="Take a live photo of the display, then we read digits automatically."
              />
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-700">
                  <video ref={videoRef} autoPlay playsInline muted className="max-h-[360px] w-full object-contain" />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" className="sm:max-w-xs" onClick={handleTakeSnapshot}>
                    <Camera className="h-4 w-4" />
                    Take photo
                  </Button>
                  <Button type="button" variant="outline" className="sm:max-w-xs" onClick={closeCameraCapture}>
                    <CameraOff className="h-4 w-4" />
                    Close camera
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

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
