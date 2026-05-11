import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Building2, Bell, LogOut, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { dairyCenterDefaults } from '../data/mockData'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

const SETTINGS_KEY = 'dairy_settings_v1'

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function Settings() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [center, setCenter] = useState(() => ({
    ...dairyCenterDefaults,
    ...readStoredSettings().center,
  }))
  const [email, setEmail] = useState(() => readStoredSettings().email || user?.email || '')
  const [notif, setNotif] = useState(() => ({
    collections: true,
    anomalies: true,
    digest: false,
    ...readStoredSettings().notif,
  }))

  function persist(partial) {
    try {
      const prev = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, ...partial }))
    } catch {
      /* ignore */
    }
  }

  function handleSaveProfile(e) {
    e.preventDefault()
    persist({ email })
    toast.success('Profile preferences saved locally')
  }

  function handleSaveCenter(e) {
    e.preventDefault()
    persist({ center })
    toast.success('Dairy center details updated (mock)')
  }

  function handleLogout() {
    logout()
    toast.success('Signed out securely')
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Admin profile, cooperative identity, and desk ergonomics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card hover>
          <CardHeader title="Admin profile" subtitle="Displayed across the console" />
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <Input label="Display name" value={user?.name || ''} disabled hint="From login (mock)" />
            <Input
              label="Notification email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <User className="h-4 w-4" />
              Save profile
            </Button>
          </form>
        </Card>

        <Card hover>
          <CardHeader title="Dairy center" subtitle="Shown on receipts and dashboards" />
          <form className="space-y-4" onSubmit={handleSaveCenter}>
            <Input
              label="Center name"
              value={center.name}
              onChange={(e) => setCenter((c) => ({ ...c, name: e.target.value }))}
            />
            <Input
              label="Center code"
              value={center.code}
              onChange={(e) => setCenter((c) => ({ ...c, code: e.target.value }))}
            />
            <Input
              label="Address"
              value={center.address}
              onChange={(e) => setCenter((c) => ({ ...c, address: e.target.value }))}
            />
            <Input
              label="Contact"
              value={center.contact}
              onChange={(e) => setCenter((c) => ({ ...c, contact: e.target.value }))}
            />
            <Button type="submit" variant="secondary">
              <Building2 className="h-4 w-4" />
              Save center
            </Button>
          </form>
        </Card>
      </div>

      <Card hover>
        <CardHeader title="Notifications" subtitle="UI-only toggles for future integrations" />
        <div className="space-y-3">
          {[
            { key: 'collections', label: 'Collection milestones', desc: 'Toast when a batch completes' },
            { key: 'anomalies', label: 'Weight anomalies', desc: 'Flag unusual readings' },
            { key: 'digest', label: 'Evening digest email', desc: 'Summary after last session' },
          ].map((row) => (
            <motion.label
              key={row.key}
              whileHover={{ x: 2 }}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.desc}</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={notif[row.key]}
                onChange={(e) => {
                  const next = { ...notif, [row.key]: e.target.checked }
                  setNotif(next)
                  persist({ notif: next })
                }}
              />
            </motion.label>
          ))}
        </div>
      </Card>

      <Card hover>
        <CardHeader title="Theme" subtitle="Neutral surfaces with emerald accents" />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={theme === 'light' ? 'primary' : 'outline'}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            type="button"
            variant={theme === 'dark' ? 'primary' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
        </div>
      </Card>

      <Card hover className="border-rose-200/80 dark:border-rose-900/40">
        <CardHeader title="Session" subtitle="Sign out on shared terminals" />
        <Button type="button" variant="danger" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </Card>
    </div>
  )
}
