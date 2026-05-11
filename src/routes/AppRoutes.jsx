import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { Login } from '../pages/Login'
import { Dashboard } from '../pages/Dashboard'
import { Farmers } from '../pages/Farmers'
import { MilkCollection } from '../pages/MilkCollection'
import { CollectionHistory } from '../pages/CollectionHistory'
import { Settings } from '../pages/Settings'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/collection" element={<MilkCollection />} />
        <Route path="/history" element={<CollectionHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
