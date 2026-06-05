import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import UsersPage from './pages/users/UsersPage'
import ProfilePage from './pages/profile/ProfilePage'
import HospitalsPage from './pages/hospitals/HospitalsPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import SchedulesPage from './pages/schedules/SchedulesPage'
import ShiftsPage from './pages/shifts/ShiftsPage'
import LeavesPage from './pages/leaves/LeavesPage'
import AttendancePage from './pages/attendance/AttendancePage'
import SwapsPage from './pages/swaps/SwapsPage'
import CertificationsPage from './pages/certifications/CertificationsPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import SpecializationsPage from './pages/specializations/SpecializationsPage'
import ClockInPage from './pages/attendance/ClockInPage'

// Auth pages
import LoginPage         from './pages/auth/LoginPage'
import OtpPage           from './pages/auth/OtpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'

// Layout + pages
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardPage   from './pages/dashboard/DashboardPage'

// ─── Route guards ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mustChangePassword } = useAuth()
  if (isAuthenticated && mustChangePassword) return <Navigate to="/change-password" replace />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route path="/login"           element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/otp/:userId"     element={<OtpPage />} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
      <Route path="/reset-password"  element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/clock-in" element={<ClockInPage />} />

      {/* Private routes — wrapped in DashboardLayout */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard"       element={<DashboardPage />} />
        <Route path="/hospitals" element={<HospitalsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/users"           element={<UsersPage />} />
        <Route path="/specializations" element={<SpecializationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route path="/my-shifts" element={<ShiftsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leaves" element={<LeavesPage />} />
        <Route path="/swaps"           element={<SwapsPage />} />
        <Route path="/certifications"  element={<CertificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// ─── Placeholder for future pages ─────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">Bu sahifa tez orada tayyor bo'ladi</p>
      </div>
    </div>
  )
}