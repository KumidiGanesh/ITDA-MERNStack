import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import useAuth from '../hooks/useAuth.js'
import '../pages/AuthPages.css'

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="auth-loading">
        <Logo />
        <span className="loading-spinner" aria-label="Loading your account" />
        <p>Getting your account ready…</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
