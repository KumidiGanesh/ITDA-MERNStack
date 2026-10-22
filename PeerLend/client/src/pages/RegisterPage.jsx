import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import useAuth from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../services/api.js'

const initialValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: '',
}

function RegisterPage() {
  const { register, user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
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

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setValues((current) => ({ ...current, [name]: nextValue }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[name]
      if (name === 'password') delete next.confirmPassword
      return next
    })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (values.password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters long.' })
      return
    }

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)

    try {
      await register(values)
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Registration successful. Sign in with your new account to continue.',
          from: location.state?.from,
        },
      })
    } catch (requestError) {
      const responseErrors = requestError.response?.data?.errors
      if (responseErrors && typeof responseErrors === 'object') {
        setFieldErrors(responseErrors)
      }
      setError(getApiErrorMessage(
        requestError,
        'We couldn’t create your account. Please check your details and try again.',
      ))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="A good place to begin"
      title="Let’s get to know you."
      description="Create your account and find your place in a community built around people."
    >
      <AuthMessage>{error}</AuthMessage>
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            maxLength={100}
            value={values.name}
            onChange={updateField}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
            required
          />
          {fieldErrors.name && <span className="field-error" id="register-name-error">{fieldErrors.name}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            value={values.email}
            onChange={updateField}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            required
          />
          {fieldErrors.email && <span className="field-error" id="register-email-error">{fieldErrors.email}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-phone">Phone number</label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit phone number"
            pattern="[0-9]{10}"
            value={values.phone}
            onChange={updateField}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
            required
          />
          {fieldErrors.phone && <span className="field-error" id="register-phone-error">{fieldErrors.phone}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-role">I’m here as a</label>
          <select
            id="register-role"
            name="role"
            value={values.role}
            onChange={updateField}
            aria-invalid={Boolean(fieldErrors.role)}
            aria-describedby={fieldErrors.role ? 'register-role-error' : undefined}
            required
          >
            <option value="" disabled>Choose your role</option>
            <option value="borrower">Borrower</option>
            <option value="lender">Lender</option>
            <option value="both">Both</option>
          </select>
          {fieldErrors.role && <span className="field-error" id="register-role-error">{fieldErrors.role}</span>}
        </div>
        <PasswordField
          id="register-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={values.password}
          onChange={updateField}
          error={fieldErrors.password}
        />
        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          value={values.confirmPassword}
          onChange={updateField}
          error={fieldErrors.confirmPassword}
        />
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
          {submitting && <span className="button-spinner" aria-hidden="true" />}
          {submitting ? 'Creating account…' : 'Create account'}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login" state={{ from: location.state?.from }}>Login</Link>
      </p>
      <p className="auth-disclaimer">
        PeerLend is in preview. Creating an account does not activate borrowing or lending.
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
