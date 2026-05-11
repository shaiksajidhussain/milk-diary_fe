import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CameraOff, QrCode, ScanLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from './ui/Button'
import { findFarmerByQrText } from '../utils/qrMatch.js'

export function QRScanner({
  farmers,
  onFarmerMatched,
  onDemoScan,
  disabled,
  demoDisabled,
  demoLoading = false,
}) {
  const uid = useId().replace(/:/g, '')
  const readerId = `qr-reader-${uid}`
  const scannerRef = useRef(null)
  const decodedOnceRef = useRef(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [starting, setStarting] = useState(false)

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) {
      setCameraOn(false)
      return
    }
    try {
      await scanner.stop()
    } catch {
      /* already stopped */
    }
    try {
      await scanner.clear()
    } catch {
      /* ignore */
    }
    setCameraOn(false)
  }, [])

  useEffect(() => {
    return () => {
      const s = scannerRef.current
      if (!s) return
      scannerRef.current = null
      s.stop()
        .catch(() => {})
        .finally(() => {
          s.clear().catch(() => {})
        })
    }
  }, [])

  const startCamera = async () => {
    if (disabled) {
      toast.error('Add or load farmers first')
      return
    }
    const host = window.location.hostname
    if (!window.isSecureContext && host !== 'localhost' && host !== '127.0.0.1') {
      toast.error('Camera requires HTTPS (or use localhost)')
      return
    }

    setStarting(true)
    decodedOnceRef.current = false
    try {
      await stopCamera()
      const el = document.getElementById(readerId)
      if (!el) {
        toast.error('Scanner not ready')
        return
      }

      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode(readerId, { verbose: false })
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const size = Math.floor(Math.min(280, minEdge * 0.72))
            return { width: size, height: size }
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (decodedOnceRef.current) return
          const farmer = findFarmerByQrText(farmers, decodedText)
          if (!farmer) {
            toast.error(`No farmer for QR: ${decodedText}`)
            return
          }
          if (farmer.status !== 'active') {
            toast.error(`${farmer.name} is inactive`)
            return
          }
          decodedOnceRef.current = true
          await stopCamera()
          onFarmerMatched(farmer)
          toast.success(`Matched — ${farmer.name}`)
        },
        () => {},
      )
      setCameraOn(true)
    } catch (err) {
      scannerRef.current = null
      setCameraOn(false)
      toast.error(err?.message || 'Could not start camera (permission denied?)')
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    decodedOnceRef.current = false
    await stopCamera()
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-emerald-400/50 bg-gradient-to-br from-emerald-500/10 via-white/40 to-teal-500/10 p-4 text-center dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10 sm:p-8">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
        animate={{ y: ['0%', '360%', '0%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-inner dark:border-slate-700">
          <div
            id={readerId}
            className={`min-h-[220px] w-full sm:min-h-[260px] ${cameraOn ? 'opacity-100' : 'opacity-90'}`}
          />
          {!cameraOn && !starting ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/75 p-4">
              <QrCode className="h-14 w-14 text-emerald-400/90" />
              <p className="text-xs text-slate-300">Camera preview appears here</p>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">QR scanner</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Use the device camera to read the farmer card QR. Codes match <span className="font-mono">FARMER-…</span> or{' '}
            <span className="font-mono">FR-…</span> from your database.
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          {!cameraOn ? (
            <Button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              loading={starting}
              className="min-w-[160px] flex-1"
            >
              <Camera className="h-4 w-4" />
              Start camera
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleStop} className="min-w-[160px] flex-1">
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          )}
          {onDemoScan ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onDemoScan}
              disabled={demoDisabled || cameraOn}
              loading={demoLoading}
              className="min-w-[160px] flex-1"
            >
              <ScanLine className="h-4 w-4" />
              Demo scan
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
