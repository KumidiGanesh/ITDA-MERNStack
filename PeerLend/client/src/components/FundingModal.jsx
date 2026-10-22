import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import AuthMessage from './AuthMessage.jsx'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function FundingModal({ loan, onClose, onFunded }) {
  const [amount, setAmount] = useState(String(loan.remainingAmount))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, submitting])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const fundingAmount = Number(amount)
    const remainingAmount = Number(loan.remainingAmount)

    if (!Number.isFinite(fundingAmount) || fundingAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (Math.abs(fundingAmount * 100 - Math.round(fundingAmount * 100)) > 1e-7) {
      setError('Enter an amount with no more than two decimal places.')
      return
    }
    if (fundingAmount > remainingAmount) {
      setError(`The amount can’t be more than the remaining ${currencyFormatter.format(remainingAmount)}.`)
      return
    }

    setSubmitting(true)
    try {
      const { data } = await loanApi.fund(loan._id, fundingAmount)
      setResult(data)
      onFunded(data.data.loan)
    } catch (requestError) {
      const fieldError = requestError.response?.data?.errors?.amount
      setError(fieldError || getApiErrorMessage(
        requestError,
        'We couldn’t complete the simulated funding. Please try again.',
      ))
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="funding-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose()
      }}
    >
      <section
        className="funding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="funding-title"
        aria-describedby="funding-description"
      >
        <button
          className="funding-modal-close"
          type="button"
          aria-label="Close funding dialog"
          onClick={onClose}
          disabled={submitting}
        >
          ×
        </button>
        {result ? (
          <div className="funding-complete">
            <div className="funding-transfer-animation" role="img" aria-label="A simulated contribution moves from lender to borrower">
              <div className="funding-transfer-person">
                <span className="funding-transfer-avatar funding-transfer-lender" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5.5 20v-1.5a6.5 6.5 0 0113 0V20z" />
                  </svg>
                </span>
                <span>Lender</span>
              </div>
              <div className="funding-transfer-track" aria-hidden="true">
                <span className="funding-transfer-line" />
                <span className="funding-transfer-coin">$</span>
              </div>
              <div className="funding-transfer-person">
                <span className="funding-transfer-avatar funding-transfer-borrower" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3.5 11 12 4l8.5 7" />
                    <path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />
                  </svg>
                </span>
                <span>Borrower</span>
              </div>
            </div>
            <span className="funding-complete-icon" aria-hidden="true">✓</span>
            <p className="section-eyebrow">Demo transaction complete</p>
            <h2 id="funding-title">You showed up.</h2>
            <p id="funding-description">
              Your simulated contribution of {currencyFormatter.format(result.data.transaction.amount)}
              {' '}has been recorded for <strong>{loan.purpose}</strong>.
            </p>
            <p className="funding-demo-warning">No real money moved. This is a simulated funding transaction.</p>
            <button className="button button-primary funding-confirm-button" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="funding-modal-icon" aria-hidden="true">↗</div>
            <p className="section-eyebrow">Community funding · Demo</p>
            <h2 id="funding-title">Back someone’s next step.</h2>
            <p className="funding-modal-intro" id="funding-description">
              Choose a simulated contribution for <strong>{loan.purpose}</strong>.
              The remaining request is {currencyFormatter.format(Number(loan.remainingAmount))}.
            </p>
            <AuthMessage>{error}</AuthMessage>
            <form onSubmit={handleSubmit}>
              <label className="funding-amount-label" htmlFor="funding-amount">Your contribution</label>
              <div className="funding-amount-input">
                <span aria-hidden="true">$</span>
                <input
                  id="funding-amount"
                  type="number"
                  min="0.01"
                  max={loan.remainingAmount}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-describedby="funding-remaining"
                  required
                  autoFocus
                />
              </div>
              <span className="funding-remaining" id="funding-remaining">
                Up to {currencyFormatter.format(Number(loan.remainingAmount))} remaining
              </span>
              <div className="funding-demo-note">
                <span aria-hidden="true">ⓘ</span>
                <p>This is a demo only. No bank account or payment method is used, and no real money will move.</p>
              </div>
              <div className="funding-modal-actions">
                <button
                  className="button button-outline"
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={submitting}>
                  {submitting && <span className="button-spinner" aria-hidden="true" />}
                  {submitting ? 'Recording demo…' : 'Confirm demo funding'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}

export default FundingModal
