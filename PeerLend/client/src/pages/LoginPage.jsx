import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import useAuth from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../services/api.js'

function LoginPage() {
  const { login, user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <main className="auth-loading">
        <span className="loading-spinner" aria-label="Checking your account" />
        <p>Checking your account…</p>
      </main>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  const notice = location.state?.notice
    ?? (location.state?.from ? 'Please sign in to continue.' : '')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(values)
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(
        requestError,
        requestError.message || 'We couldn’t sign you in. Please try again.',
      ))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Good to see you."
      description="Sign in to pick up where your PeerLend journey begins."
    >
      <AuthMessage type="notice">{notice}</AuthMessage>
      <AuthMessage>{error}</AuthMessage>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            required
          />
        </div>
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
        />
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
          {submitting && <span className="button-spinner" aria-hidden="true" />}
          {submitting ? 'Signing in…' : 'Login'}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      </form>
      <p className="auth-switch">
        New to PeerLend? <Link to="/register">Create an account</Link>
      </p>
      <p className="auth-disclaimer">
        Passwords are securely hashed. Your sign-in lasts for this browser tab.
      </p>
    </AuthLayout>
  )
}

export default LoginPage
