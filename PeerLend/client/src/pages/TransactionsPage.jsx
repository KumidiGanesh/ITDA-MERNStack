import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import useAuth from '../hooks/useAuth.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { getApiErrorMessage, transactionApi } from '../services/api.js'
import './TransactionsPage.css'

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

const filters = [
  { label: 'All', value: 'ALL' },
  { label: 'Funding', value: 'FUNDING' },
  { label: 'Repayment', value: 'REPAYMENT' },
  { label: 'Refund', value: 'REFUND' },
]

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

function displayType(type) {
  if (type === 'SIMULATED_FUNDING') return 'Funding'
  return type.charAt(0) + type.slice(1).toLowerCase()
}

function TransactionsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [type, setType] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  usePeerLendSocket({
    loanFunded: ({ transaction }) => {
      if (transaction?.type === 'FUNDING') setRequestVersion((version) => version + 1)
    },
    paymentReceived: ({ transaction }) => {
      if (transaction?.type === 'REPAYMENT') setRequestVersion((version) => version + 1)
    },
    repaymentMade: ({ transaction }) => {
      if (transaction?.type === 'REPAYMENT') setRequestVersion((version) => version + 1)
    },
    paymentCompleted: ({ transaction }) => {
      if (transaction?.type === 'REPAYMENT') setRequestVersion((version) => version + 1)
    },
  })

  useEffect(() => {
    let active = true
    const debounce = window.setTimeout(() => {
      setLoading(true)
      setError('')

      transactionApi.getAll({
        type,
        search,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: 10,
      })
        .then(({ data }) => {
          if (!active) return
          setTransactions(data.data.transactions)
          setPagination(data.data.pagination)
        })
        .catch((requestError) => {
          if (active) {
            setError(getApiErrorMessage(
              requestError,
              'We couldn’t load your transactions. Please try again.',
            ))
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, search ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(debounce)
    }
  }, [type, search, sortBy, sortOrder, pagination.page, requestVersion])

  function handleFilter(nextType) {
    setType(nextType)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  function handleSearch(event) {
    setSearch(event.target.value)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { notice: 'You have been signed out.' } })
  }

  return (
    <main className="transaction-page">
      <header className="dashboard-nav transaction-nav">
        <Logo home />
        <nav className="loan-nav-links" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          {['borrower', 'both'].includes(user.role) && <Link to="/my-loans">My Loans</Link>}
          {['lender', 'both'].includes(user.role) && <Link to="/marketplace">Marketplace</Link>}
          <Link className="loan-nav-active" to="/transactions">Transactions</Link>
          <NotificationBell />
          <button className="button dashboard-logout" type="button" onClick={handleLogout}>Log out</button>
        </nav>
      </header>

      <div className="transaction-shell">
        <div className="transaction-page-heading">
          <div>
            <p className="section-eyebrow">Your account activity</p>
            <h1>Transactions</h1>
            <p>Review the funding, repayments, and refunds linked to your PeerLend account.</p>
          </div>
          {!loading && !error && (
            <span className="transaction-total-count">
              {pagination.total} {pagination.total === 1 ? 'transaction' : 'transactions'}
            </span>
          )}
        </div>

        <section className="transaction-toolbar" aria-label="Transaction filters">
          <div className="transaction-filters" role="group" aria-label="Filter transaction type">
            {filters.map((filter) => (
              <button
                className={`transaction-filter${type === filter.value ? ' transaction-filter-active' : ''}`}
                type="button"
                key={filter.value}
                aria-pressed={type === filter.value}
                onClick={() => handleFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="transaction-controls">
            <label className="transaction-search">
              <span className="sr-only">Search transactions</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder="Search ID or loan"
                maxLength={100}
              />
            </label>
            <label className="transaction-sort">
              <span className="sr-only">Sort transactions</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(event) => {
                  const [nextSortBy, nextSortOrder] = event.target.value.split(':')
                  setSortBy(nextSortBy)
                  setSortOrder(nextSortOrder)
                  setPagination((current) => ({ ...current, page: 1 }))
                }}
              >
                <option value="date:desc">Newest first</option>
                <option value="date:asc">Oldest first</option>
                <option value="amount:desc">Amount: high to low</option>
                <option value="amount:asc">Amount: low to high</option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="transaction-state transaction-error" role="alert">
            <span className="transaction-state-icon" aria-hidden="true">!</span>
            <h2>Transactions unavailable</h2>
            <p>{error}</p>
            <button className="button button-outline" type="button" onClick={() => setRequestVersion((v) => v + 1)}>
              Try again
            </button>
          </div>
        )}

        {!error && loading ? (
          <div className="transaction-state" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your transactions…</p>
          </div>
        ) : !error && transactions.length === 0 ? (
          <div className="transaction-state transaction-empty">
            <span className="transaction-state-icon" aria-hidden="true">↗</span>
            <h2>{search || type !== 'ALL' ? 'No matching transactions' : 'No transactions yet'}</h2>
            <p>
              {search || type !== 'ALL'
                ? 'Try changing the transaction type or search terms.'
                : 'Your funding and repayment activity will appear here when available.'}
            </p>
            {(search || type !== 'ALL') && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => {
                  setSearch('')
                  handleFilter('ALL')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : !error && (
          <>
            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th scope="col">Transaction ID</th>
                    <th scope="col">Date</th>
                    <th scope="col">Type</th>
                    <th scope="col">Loan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>
                        <span className="transaction-reference" title={transaction._id}>
                          {transaction.reference || transaction._id}
                        </span>
                      </td>
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td>
                        <span className={`transaction-type-badge transaction-type-${transaction.type.toLowerCase().replace('simulated_', '')}`}>
                          {displayType(transaction.type)}
                        </span>
                      </td>
                      <td>
                        <span className="transaction-loan-title">
                          {transaction.loan?.purpose || 'Loan request'}
                        </span>
                        {transaction.loan?._id && (
                          <span className="transaction-loan-id">Loan {transaction.loan._id.slice(-8)}</span>
                        )}
                      </td>
                      <td className="transaction-amount">{currencyFormatter.format(transaction.amount)}</td>
                      <td>
                        <span className={`transaction-status transaction-status-${transaction.status.toLowerCase()}`}>
                          {transaction.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <nav className="transaction-pagination" aria-label="Transaction pages">
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <div>
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                  >
                    Previous
                  </button>
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
        <p className="transaction-demo-note">Transaction history is provided for PeerLend demo activity. No real payments are processed.</p>
      </div>
      <AppBottomNav />
    </main>
  )
}

export default TransactionsPage
