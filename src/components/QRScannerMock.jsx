import { motion } from 'framer-motion'
import { ScanLine, QrCode } from 'lucide-react'
import { Button } from './ui/Button'

export function QRScannerMock({ onScan, scanning, disabled }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-emerald-400/50 bg-gradient-to-br from-emerald-500/10 via-white/40 to-teal-500/10 p-8 text-center dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
        animate={{ y: ['0%', '360%', '0%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4">
        <motion.div
          animate={scanning ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 1.2, repeat: scanning ? Infinity : 0 }}
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/90 shadow-lg shadow-emerald-600/10 ring-1 ring-emerald-500/20 dark:bg-slate-900/90 dark:ring-emerald-400/30"
        >
          <QrCode className="h-12 w-12 text-emerald-700 dark:text-emerald-300" />
        </motion.div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">QR Scanner</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Position the farmer card in frame. Mock mode selects the next farmer in queue.
          </p>
        </div>
        <Button
          type="button"
          onClick={onScan}
          disabled={disabled}
          loading={scanning}
          className="min-w-[200px]"
        >
          <ScanLine className="h-4 w-4" />
          Scan QR
        </Button>
      </div>
    </div>
  )
}
