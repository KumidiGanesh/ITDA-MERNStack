import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import useAuth from '../hooks/useAuth.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import './LoanPages.css'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function LoanStatus({ status }) {
  return <span className={`loan-status status-${status.toLowerCase()}`}>{status.toLowerCase()}</span>
}

function MyLoansPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveNotice, setLiveNotice] = useState('')

  function applyLoanEvent({ loan }) {
    if (!loan?._id) return
    setLoans((currentLoans) => {
      const exists = currentLoans.some((currentLoan) => currentLoan._id === loan._id)
      if (!exists) return [loan, ...currentLoans]
      return currentLoans.map((currentLoan) => (
        currentLoan._id === loan._id ? { ...currentLoan, ...loan } : currentLoan
      ))
    })
  }

  usePeerLendSocket({
    loanCreated: applyLoanEvent,
    loanUpdated: applyLoanEvent,
    loanFunded: applyLoanEvent,
    repaymentMade: applyLoanEvent,
    notificationCreated: (event) => {
      if (event?.message) setLiveNotice(event.message)
    },
  })

  useEffect(() => {
    let active = true

    loanApi.getMine()
      .then(({ data }) => {
        if (active) setLoans(data.data.loans)
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'We couldn’t load your loan requests. Please try again.',
          ))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { notice: 'You have been signed out.' } })
  }

  async function handleRetry() {
    setError('')
    setLoading(true)
    try {
      const { data } = await loanApi.getMine()
      setLoans(data.data.loans)
    } catch (requestError) {
      setError(getApiErrorMessage(
        requestError,
        'We couldn’t load your loan requests. Please try again.',
      ))
    } finally {
      setLoading(false)
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
      <div className="loan-page-shell">
        <Link className="loan-back-link" to="/dashboard">← Back to dashboard</Link>
        <div className="my-loans-heading">
          <div className="loan-page-heading">
            <p className="section-eyebrow">Your PeerLend space</p>
            <h1>My Loans</h1>
            <p>Hi {user.name.split(' ')[0]}, here are the requests you’ve submitted.</p>
          </div>
        </div>

        <AuthMessage>{error}</AuthMessage>
        <AuthMessage type="notice">{liveNotice}</AuthMessage>
        {loading ? (
          <div className="loan-list-loading" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your loan requests…</p>
          </div>
        ) : error ? (
          <div className="loan-empty-state">
            <span className="loan-empty-icon" aria-hidden="true">↻</span>
            <h2>We couldn’t load your requests.</h2>
            <p>Your requests haven’t been changed. Please try again.</p>
            <button
              className="button button-outline"
              type="button"
              onClick={handleRetry}
            >
              Try again
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="loan-empty-state">
            <span className="loan-empty-icon" aria-hidden="true">＋</span>
            <h2>Your next step starts with a request.</h2>
            <p>You haven’t submitted a loan request yet. When you do, you’ll find it here.</p>
          </div>
        ) : (
          <div className="loan-list" aria-label="Your loan requests">
            {loans.map((loan) => (
              <article className="loan-list-card" key={loan._id}>
                <div className="loan-list-card-main">
                  <div className="loan-list-title">
                    <div>
                      <p className="section-eyebrow">Loan request</p>
                      <h2>{loan.purpose}</h2>
                    </div>
                    <LoanStatus status={loan.status} />
                  </div>
                  <p className="loan-list-description">{loan.description}</p>
                  <div className="loan-meta">
                    <span>{loan.duration} {loan.duration === 1 ? 'month' : 'months'}</span>
                    <span>{loan.repaymentFrequency.toLowerCase().replace('biweekly', 'every two weeks')}</span>
                    <span>Submitted {formatDate(loan.createdAt)}</span>
                  </div>
                  {loan.address && (
                    <address className="loan-list-address">
                      {[
                        loan.address.houseStreet,
                        loan.address.villageTown,
                        loan.address.mandal,
                        loan.address.postOffice,
                        loan.address.pinCode,
                        loan.address.district,
                        loan.address.state,
                        loan.address.country,
                      ].filter(Boolean).join(', ')}
                    </address>
                  )}
                </div>
                <div className="loan-list-amount">
                  <span>Requested</span>
                  <strong>{currencyFormatter.format(loan.amount)}</strong>
                  {['FUNDED', 'ACTIVE', 'COMPLETED'].includes(loan.status) && (
                    <Link className="loan-repayment-link" to={`/loans/${loan._id}/repayments`}>
                      {loan.status === 'COMPLETED' ? 'Repayment history' : 'Make repayment'}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <AppBottomNav />
    </main>
  )
}

export default MyLoansPage
