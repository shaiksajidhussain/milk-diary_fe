import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { farmersApi, collectionsApi, dashboardApi } from '../services/api'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

function isSameCalendarDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth()

  // ---------- farmers ----------
  const [farmers, setFarmers] = useState([])
  const [farmersLoading, setFarmersLoading] = useState(false)

  const fetchFarmers = useCallback(async (params = {}) => {
    setFarmersLoading(true)
    try {
      const { items } = await farmersApi.list({ limit: 100, ...params })
      setFarmers(items)
      return items
    } finally {
      setFarmersLoading(false)
    }
  }, [])

  // ---------- collections ----------
  const [collections, setCollections] = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  const fetchCollections = useCallback(async (params = {}) => {
    setCollectionsLoading(true)
    try {
      const { items } = await collectionsApi.list({ limit: 100, ...params })
      setCollections(items)
      return items
    } finally {
      setCollectionsLoading(false)
    }
  }, [])

  // ---------- dashboard stats from API ----------
  const [dashboardStats, setDashboardStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    todayCollectionCount: 0,
    todayLiters: 0,
    totalLiters: 0,
    morningTodayLiters: 0,
    eveningTodayLiters: 0,
    topFarmersToday: [],
  })
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true)
    try {
      const stats = await dashboardApi.stats()
      setDashboardStats({
        totalFarmers: stats.totalFarmers ?? 0,
        activeFarmers: stats.totalFarmers ?? 0,
        todayCollectionCount: stats.todayCollections ?? 0,
        todayLiters: stats.totalMilkTodayLiters ?? 0,
        totalLiters: stats.totalMilkTodayLiters ?? 0,
        morningTodayLiters: stats.morningTodayLiters ?? 0,
        eveningTodayLiters: stats.eveningTodayLiters ?? 0,
        topFarmersToday: [],
      })
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  // ---------- chart series (derived from collections) ----------
  const chartSeries = useMemo(() => {
    const days = 7
    const labels = []
    const values = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(12, 0, 0, 0)
      const label = d.toLocaleDateString(undefined, { weekday: 'short' })
      const sum = collections
        .filter((c) => isSameCalendarDay(c.collectedAt || c.createdAt, d))
        .reduce((s, c) => s + Number(c.weight), 0)
      labels.push(label)
      values.push(Math.round(sum * 10) / 10)
    }
    return { labels, values }
  }, [collections])

  // ---------- recent activity ----------
  const recentActivity = useMemo(() => {
    return [...collections]
      .sort((a, b) => new Date(b.collectedAt || b.createdAt) - new Date(a.collectedAt || a.createdAt))
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        title: `${c.farmer?.name ?? c.farmerName ?? 'Farmer'} · ${Number(c.weight).toFixed(2)} L`,
        subtitle: `${c.session} session`,
        time: c.collectedAt || c.createdAt,
      }))
  }, [collections])

  // ---------- mutations ----------
  const addFarmer = useCallback(async (payload) => {
    const created = await farmersApi.create(payload)
    setFarmers((prev) => [created, ...prev])
    return created
  }, [])

  const updateFarmer = useCallback(async (id, payload) => {
    const updated = await farmersApi.update(id, payload)
    setFarmers((prev) => prev.map((f) => (f.id === id ? updated : f)))
    return updated
  }, [])

  const removeFarmer = useCallback(async (id) => {
    await farmersApi.remove(id)
    setFarmers((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const addCollection = useCallback(async (entry) => {
    const created = await collectionsApi.create({
      farmerId: entry.farmerId,
      weight: entry.weight,
      session: entry.session,
      collectedAt: entry.collectedAt,
      ...(entry.scalePhotoDataUrl ? { scalePhotoDataUrl: entry.scalePhotoDataUrl } : {}),
    })
    setCollections((prev) => [created, ...prev])
    // refresh dashboard stats after a new collection
    await dashboardApi.stats().then((stats) => {
      setDashboardStats({
        totalFarmers: stats.totalFarmers ?? 0,
        activeFarmers: stats.totalFarmers ?? 0,
        todayCollectionCount: stats.todayCollections ?? 0,
        todayLiters: stats.totalMilkTodayLiters ?? 0,
        totalLiters: stats.totalMilkTodayLiters ?? 0,
        morningTodayLiters: stats.morningTodayLiters ?? 0,
        eveningTodayLiters: stats.eveningTodayLiters ?? 0,
        topFarmersToday: [],
      })
    }).catch(() => {})
    return created
  }, [])

  // ---------- initial load when authenticated ----------
  const loaded = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      // user just logged out — allow re-fetch on next login
      loaded.current = false
      return
    }
    if (loaded.current) return
    loaded.current = true
    fetchFarmers()
    fetchCollections()
    fetchDashboard()
  }, [isAuthenticated, fetchFarmers, fetchCollections, fetchDashboard])

  const value = useMemo(
    () => ({
      // data
      farmers,
      collections,
      dashboardStats,
      chartSeries,
      recentActivity,
      // loading flags
      farmersLoading,
      collectionsLoading,
      dashboardLoading,
      // mutations
      addFarmer,
      updateFarmer,
      removeFarmer,
      addCollection,
      // manual refetchers
      fetchFarmers,
      fetchCollections,
      fetchDashboard,
    }),
    [
      farmers,
      collections,
      dashboardStats,
      chartSeries,
      recentActivity,
      farmersLoading,
      collectionsLoading,
      dashboardLoading,
      addFarmer,
      updateFarmer,
      removeFarmer,
      addCollection,
      fetchFarmers,
      fetchCollections,
      fetchDashboard,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
