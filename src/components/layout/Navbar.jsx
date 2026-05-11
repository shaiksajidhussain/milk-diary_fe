import { Menu, Bell, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export function Navbar({ onMenu }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search farmers, batches, IDs…"
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2 pl-10 pr-3 text-sm text-slate-800 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:border-emerald-500/60 focus:ring-2 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </motion.button>
          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 sm:flex dark:border-slate-700 dark:bg-slate-900/60">
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in</p>
              <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || 'Admin'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md">
              {(user?.name || 'A').slice(0, 1)}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
