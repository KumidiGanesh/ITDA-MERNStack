import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import useAuth from '../hooks/useAuth.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import './LoanPages.css'
import './RepaymentPage.css'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not scheduled' : dateFormatter.format(date)
}

function addMonths(date, months) {
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(day, lastDay))
  return result
}

function getNextPaymentDate(loan) {
  const scheduledStart = loan?.repaymentStartDate || loan?.updatedAt
  if (!scheduledStart) return loan?.dueDate ?? null

  const start = new Date(scheduledStart)
  if (Number.isNaN(start.getTime())) return loan.dueDate ?? null

  const now = new Date()
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
  const intervalDays = loan.repaymentFrequency === 'WEEKLY'
    ? 7
    : loan.repaymentFrequency === 'BIWEEKLY'
      ? 14
      : 0
  let nextDate = new Date(start)

  for (let installment = 0; installment < 1000 && nextDate <= now; installment += 1) {
    if (intervalDays) {
      nextDate.setDate(nextDate.getDate() + intervalDays)
    } else {
      nextDate = addMonths(start, installment + 1)
    }
  }

  if (dueDate && nextDate > dueDate) return dueDate
  return nextDate
}

function getSuggestedAmount(loan) {
  if (!loan) return ''
  const frequencyDays = loan.repaymentFrequency === 'WEEKLY'
    ? 7
    : loan.repaymentFrequency === 'BIWEEKLY'
      ? 14
      : 30.4375
  const installmentCount = Math.max(
    1,
    Math.ceil((Number(loan.duration) * 30.4375) / frequencyDays),
  )
  const remaining = Math.max(0, Number(loan.amount) - (Number(loan.paidAmount) || 0))
  return Math.min(remaining, Math.round((Number(loan.amount) / installmentCount) * 100) / 100)
    .toFixed(2)
}

function RepaymentPage() {
  const { loanId } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loan, setLoan] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function applyLoanEvent({ loan: updatedLoan }) {
    if (updatedLoan?._id === loanId) setLoan(updatedLoan)
  }

  usePeerLendSocket({
    loanUpdated: applyLoanEvent,
    loanFunded: applyLoanEvent,
    repaymentMade: ({ loan: updatedLoan, transaction }) => {
      applyLoanEvent({ loan: updatedLoan })
      if (updatedLoan?._id !== loanId || !transaction?._id) return
      setTransactions((current) => (
        current.some((item) => item._id === transaction._id)
          ? current
          : [transaction, ...current]
      ))
    },
    notificationCreated: (event) => {
      if (event?.loanId === loanId && event.message) setNotice(event.message)
    },
  })

  useEffect(() => {
    let active = true

    loanApi.getRepayments(loanId)
      .then(({ data }) => {
        if (!active) return
        setLoan(data.data.loan)
        setTransactions(data.data.transactions)
        setAmount(getSuggestedAmount(data.data.loan))
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'We couldn’t load this loan’s repayment details. Please try again.',
          ))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loanId])

  const paidAmount = Number(loan?.paidAmount) || 0
  const totalAmount = Number(loan?.amount) || 0
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const progress = totalAmount > 0
    ? Math.min(100, Math.round((paidAmount / totalAmount) * 100))
    : 0
  const nextPaymentDate = useMemo(() => getNextPaymentDate(loan), [loan])
  const dueDate = loan?.dueDate
    || (loan?.updatedAt ? addMonths(new Date(loan.updatedAt), Number(loan.duration) || 0) : null)
  const canRepay = ['FUNDED', 'ACTIVE'].includes(loan?.status) && remainingAmount > 0

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { notice: 'You have been signed out.' } })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const repaymentAmount = Number(amount)
    if (!Number.isFinite(repaymentAmount) || repaymentAmount < 0.01) {
      setError('Enter a repayment amount of at least $0.01.')
      return
    }
    if (Math.round(repaymentAmount * 100) !== repaymentAmount * 100) {
      setError('Enter an amount with no more than two decimal places.')
      return
    }
    if (repaymentAmount > remainingAmount) {
      setError(`Your repayment cannot exceed the remaining balance of ${currencyFormatter.format(remainingAmount)}.`)
      return
    }

    setSubmitting(true)
    try {
      const { data } = await loanApi.repay(loanId, repaymentAmount)
      setLoan(data.data.loan)
      setTransactions((previous) => [data.data.transaction, ...previous])
      setAmount(getSuggestedAmount(data.data.loan))
      setNotice(data.message || 'Simulated repayment successful.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We couldn’t process this repayment. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="loan-app-page">
      <header className="dashboard-nav">
        <Logo home />
        <nav className="loan-nav-links" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link className="loan-nav-active" to="/my-loans">My Loans</Link>
          <Link to="/transactions">Transactions</Link>
          <NotificationBell />
          <button className="button dashboard-logout" type="button" onClick={handleLogout}>Log out</button>
        </nav>
      </header>

      <div className="loan-page-shell repayment-shell">
        <Link className="loan-back-link" to="/my-loans">← Back to my loans</Link>

        {loading ? (
          <div className="loan-list-loading" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your repayment details…</p>
          </div>
        ) : error && !loan ? (
          <div className="loan-empty-state">
            <AuthMessage>{error}</AuthMessage>
            <h1>Repayment details unavailable</h1>
            <p>We couldn’t load this loan. Return to My Loans and try again.</p>
            <Link className="button button-outline" to="/my-loans">Return to My Loans</Link>
          </div>
        ) : loan && (
          <>
            <div className="repayment-heading">
              <div className="loan-page-heading">
                <p className="section-eyebrow">Borrower account</p>
                <h1>Loan repayment</h1>
                <p>{loan.purpose} · Hi {user.name.split(' ')[0]}, track your progress and payment history.</p>
              </div>
              <span className={`loan-status status-${loan.status.toLowerCase()}`}>{loan.status.toLowerCase()}</span>
            </div>

            <AuthMessage type="notice">{notice}</AuthMessage>
            <AuthMessage>{error}</AuthMessage>

            <section className="repayment-summary" aria-label="Loan repayment summary">
              <div className="repayment-total">
                <span>Total loan</span>
                <strong>{currencyFormatter.format(totalAmount)}</strong>
                <div className="repayment-progress" role="progressbar" aria-label="Repayment progress" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <small>{progress}% repaid</small>
              </div>
              <div className="repayment-summary-item">
                <span>Paid amount</span>
                <strong>{currencyFormatter.format(paidAmount)}</strong>
              </div>
              <div className="repayment-summary-item">
                <span>Remaining amount</span>
                <strong>{currencyFormatter.format(remainingAmount)}</strong>
              </div>
              <div className="repayment-summary-item">
                <span>Next payment</span>
                <strong>{formatDate(nextPaymentDate)}</strong>
              </div>
              <div className="repayment-summary-item">
                <span>Due date</span>
                <strong>{formatDate(dueDate)}</strong>
              </div>
            </section>

            <div className="repayment-content-grid">
              <section className="repayment-history-card">
                <div className="repayment-section-heading">
                  <div>
                    <p className="section-eyebrow">Your activity</p>
                    <h2>Repayment history</h2>
                  </div>
                  <span>{transactions.length} {transactions.length === 1 ? 'payment' : 'payments'}</span>
                </div>
                {transactions.length === 0 ? (
                  <div className="repayment-history-empty">
                    <span aria-hidden="true">↗</span>
                    <p>Your completed demo repayments will appear here.</p>
                  </div>
                ) : (
                  <div className="repayment-history-list">
                    {transactions.map((transaction) => (
                      <article className="repayment-history-row" key={transaction._id}>
                        <span className="repayment-history-icon" aria-hidden="true">✓</span>
                        <div className="repayment-history-copy">
                          <strong>Loan repayment</strong>
                          <span>{formatDate(transaction.createdAt)} · Ref {transaction.reference}</span>
                        </div>
                        <div className="repayment-history-amount">
                          <strong>−{currencyFormatter.format(transaction.amount)}</strong>
                          <span className={`repayment-transaction-status transaction-${transaction.status.toLowerCase()}`}>
                            {transaction.status.toLowerCase()}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="repayment-form-card">
                <p className="section-eyebrow">Simulated payment</p>
                <h2>{canRepay ? 'Make a repayment' : 'Repayment complete'}</h2>
                {canRepay ? (
                  <form onSubmit={handleSubmit}>
                    <label className="auth-field" htmlFor="repayment-amount">
                      <span>Repayment amount</span>
                      <div className="amount-input-wrap repayment-amount-wrap">
                        <span aria-hidden="true">$</span>
                        <input
                          id="repayment-amount"
                          type="number"
                          min="0.01"
                          max={remainingAmount}
                          step="0.01"
                          inputMode="decimal"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          required
                        />
                      </div>
                      <small>Up to {currencyFormatter.format(remainingAmount)} remaining</small>
                    </label>
                    <button className="button button-primary repayment-submit" type="submit" disabled={submitting}>
                      {submitting ? (
                        <><span className="loading-spinner" aria-hidden="true" /> Processing…</>
                      ) : (
                        <>Make Repayment <span aria-hidden="true">→</span></>
                      )}
                    </button>
                  </form>
                ) : (
                  <p className="repayment-complete-copy">
                    This loan is fully repaid. You can still review the history of your demo transactions.
                  </p>
                )}
                <p className="repayment-demo-note">
                  Demo only: this records a simulated principal repayment. No real money moves, and no payment gateway is connected.
                </p>
              </aside>
            </div>
          </>
        )}
      </div>
      <AppBottomNav />
    </main>
  )
}

export default RepaymentPage
