import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  ScanLine,
  History,
  Settings,
  Milk,
  X,
} from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/farmers', label: 'Farmers', icon: Users },
  { to: '/collection', label: 'Milk Collection', icon: ScanLine },
  { to: '/history', label: 'Collection History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 px-4 py-3 dark:from-emerald-400/10 dark:to-teal-500/5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 dark:bg-emerald-500">
          <Milk className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-emerald-700/90 dark:text-emerald-300/90">
            Dairy Center
          </p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            Milk Collection
          </p>
        </div>
      </div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 dark:bg-emerald-500'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span>{label}</span>
              {isActive ? (
                <motion.span
                  layoutId="nav-pill"
                  className="ml-auto h-2 w-2 rounded-full bg-white/90"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 lg:flex lg:flex-col">
        <SidebarNav />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden dark:bg-black/60"
              aria-label="Close menu"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:hidden"
            >
              <div className="flex items-center justify-end border-b border-slate-100 p-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
