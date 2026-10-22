import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import useAuth from '../hooks/useAuth.js'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import './LoanPages.css'

const initialValues = {
  amount: '',
  purpose: '',
  description: '',
  duration: '',
  repaymentFrequency: '',
  address: {
    houseStreet: '',
    villageTown: '',
    mandal: '',
    postOffice: '',
    pinCode: '',
    district: '',
    state: '',
    country: 'India',
  },
}

const addressFields = [
  { name: 'houseStreet', label: 'House / flat / street address', placeholder: 'House number, street, or locality', maxLength: 150 },
  { name: 'villageTown', label: 'Village / town', placeholder: 'Village or town', maxLength: 100 },
  { name: 'mandal', label: 'Mandal / taluk', placeholder: 'Mandal or taluk', maxLength: 100 },
  { name: 'postOffice', label: 'Post office', placeholder: 'Post office name', maxLength: 100 },
  { name: 'pinCode', label: 'PIN code', placeholder: '6-digit PIN code', maxLength: 6, inputMode: 'numeric' },
  { name: 'district', label: 'District', placeholder: 'District', maxLength: 100 },
  { name: 'state', label: 'State', placeholder: 'State', maxLength: 100 },
  { name: 'country', label: 'Country', placeholder: 'Country', maxLength: 100 },
]

function LoanRequestPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    if (name.startsWith('address.')) {
      const addressField = name.slice('address.'.length)
      setValues((current) => ({
        ...current,
        address: { ...current.address, [addressField]: value },
      }))
    } else {
      setValues((current) => ({ ...current, [name]: value }))
    }
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setErrors({})

    const validationErrors = {}
    const amount = Number(values.amount)
    const duration = Number(values.duration)

    if (!values.amount || !Number.isFinite(amount) || amount < 1) {
      validationErrors.amount = 'Enter a valid amount of at least 1.'
    } else if (Math.round(amount * 100) !== amount * 100) {
      validationErrors.amount = 'Amount can have no more than 2 decimal places.'
    }
    if (values.purpose.trim().length < 2 || values.purpose.trim().length > 100) {
      validationErrors.purpose = 'Purpose must be between 2 and 100 characters.'
    }
    if (values.description.trim().length < 20 || values.description.trim().length > 2000) {
      validationErrors.description = 'Description must be between 20 and 2000 characters.'
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
      validationErrors.duration = 'Choose a duration between 1 and 60 months.'
    }
    if (!['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(values.repaymentFrequency)) {
      validationErrors.repaymentFrequency = 'Choose a repayment frequency.'
    }
    for (const field of addressFields) {
      const value = values.address[field.name].trim()
      if (!value) {
        validationErrors[`address.${field.name}`] = `${field.label} is required.`
      } else if (field.name === 'pinCode' && !/^\d{6}$/.test(value)) {
        validationErrors['address.pinCode'] = 'Enter a valid 6-digit Indian PIN code.'
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const { data } = await loanApi.create({
        ...values,
        amount,
        duration,
      })
      setSuccess(data.message || 'Loan request submitted successfully.')
      setValues(initialValues)
    } catch (requestError) {
      const responseErrors = requestError.response?.data?.errors
      if (responseErrors && typeof responseErrors === 'object') {
        setErrors(responseErrors)
      }
      setError(getApiErrorMessage(
        requestError,
        'We couldn’t submit your request. Please review the details and try again.',
      ))
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { notice: 'You have been signed out.' } })
  }

  return (
    <main className="loan-app-page">
      <header className="dashboard-nav">
        <Logo home />
        <nav className="loan-nav-links" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-loans">My Loans</Link>
          <Link to="/transactions">Transactions</Link>
          <NotificationBell />
          <button className="button dashboard-logout" type="button" onClick={handleLogout}>Log out</button>
        </nav>
      </header>
      <div className="loan-page-shell">
        <Link className="loan-back-link" to="/dashboard">← Back to dashboard</Link>
        <div className="loan-page-heading">
          <p className="section-eyebrow">A thoughtful next step</p>
          <h1>Create Loan Request</h1>
          <p>Share a little about what you need. Clear details help your community understand your request.</p>
        </div>
        <form className="loan-form" onSubmit={handleSubmit} noValidate>
          <AuthMessage>{error}</AuthMessage>
          <AuthMessage type="notice">{success}</AuthMessage>
          <div className="loan-form-grid">
            <div className="auth-field">
              <label htmlFor="loan-amount">Amount requested</label>
              <div className="amount-input-wrap">
                <span aria-hidden="true">$</span>
                <input
                  id="loan-amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="1,000.00"
                  value={values.amount}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={errors.amount ? 'loan-amount-error' : 'loan-amount-hint'}
                  required
                />
              </div>
              {errors.amount
                ? <span className="field-error" id="loan-amount-error">{errors.amount}</span>
                : <span className="field-hint" id="loan-amount-hint">Enter an amount greater than zero.</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="loan-purpose">Purpose</label>
              <input
                id="loan-purpose"
                name="purpose"
                type="text"
                minLength={2}
                maxLength={100}
                placeholder="e.g. Education expenses"
                value={values.purpose}
                onChange={updateField}
                aria-invalid={Boolean(errors.purpose)}
                aria-describedby={errors.purpose ? 'loan-purpose-error' : undefined}
                required
              />
              {errors.purpose && <span className="field-error" id="loan-purpose-error">{errors.purpose}</span>}
            </div>
            <div className="auth-field loan-field-wide">
              <label htmlFor="loan-description">Tell us a little more</label>
              <textarea
                id="loan-description"
                name="description"
                minLength={20}
                maxLength={2000}
                rows={5}
                placeholder="What would this loan help you do? Share the details you feel comfortable including."
                value={values.description}
                onChange={updateField}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'loan-description-error' : 'loan-description-count'}
                required
              />
              {errors.description
                ? <span className="field-error" id="loan-description-error">{errors.description}</span>
                : <span className="field-hint loan-description-count" id="loan-description-count">{values.description.length}/2000 · At least 20 characters</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="loan-duration">Repayment duration</label>
              <div className="select-suffix-wrap">
                <select
                  id="loan-duration"
                  name="duration"
                  value={values.duration}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.duration)}
                  aria-describedby={errors.duration ? 'loan-duration-error' : undefined}
                  required
                >
                  <option value="" disabled>Select duration</option>
                  {[3, 6, 9, 12, 18, 24, 36, 48, 60].map((months) => (
                    <option value={months} key={months}>{months} {months === 1 ? 'month' : 'months'}</option>
                  ))}
                </select>
              </div>
              {errors.duration && <span className="field-error" id="loan-duration-error">{errors.duration}</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="loan-frequency">Repayment frequency</label>
              <select
                id="loan-frequency"
                name="repaymentFrequency"
                value={values.repaymentFrequency}
                onChange={updateField}
                aria-invalid={Boolean(errors.repaymentFrequency)}
                aria-describedby={errors.repaymentFrequency ? 'loan-frequency-error' : undefined}
                required
              >
                <option value="" disabled>Select frequency</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every two weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              {errors.repaymentFrequency && <span className="field-error" id="loan-frequency-error">{errors.repaymentFrequency}</span>}
            </div>
            <fieldset className="loan-address-section loan-field-wide">
              <legend>Full address</legend>
              <p>Enter your current address, including post office and PIN code.</p>
              <div className="loan-address-grid">
                {addressFields.map((field) => {
                  const errorKey = `address.${field.name}`
                  const errorId = `address-${field.name}-error`

                  return (
                    <div className="auth-field" key={field.name}>
                      <label htmlFor={`loan-${field.name}`}>{field.label}</label>
                      <input
                        id={`loan-${field.name}`}
                        name={errorKey}
                        type="text"
                        maxLength={field.maxLength}
                        inputMode={field.inputMode}
                        pattern={field.name === 'pinCode' ? '[0-9]{6}' : undefined}
                        placeholder={field.placeholder}
                        value={values.address[field.name]}
                        onChange={updateField}
                        aria-invalid={Boolean(errors[errorKey])}
                        aria-describedby={errors[errorKey] ? errorId : undefined}
                        required
                      />
                      {errors[errorKey] && (
                        <span className="field-error" id={errorId}>{errors[errorKey]}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </div>
          <div className="loan-form-footer">
            <p>Your request will start as pending. Funding and repayment are not available in this preview.</p>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting && <span className="button-spinner" aria-hidden="true" />}
              {submitting ? 'Submitting request…' : 'Submit loan request'}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </div>
          {success && <Link className="loan-success-link" to="/my-loans">View your requests →</Link>}
        </form>
      </div>
      <AppBottomNav />
    </main>
  )
}

export default LoanRequestPage
