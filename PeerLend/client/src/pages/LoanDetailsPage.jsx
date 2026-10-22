import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthMessage from '../components/AuthMessage.jsx'
import FundingModal from '../components/FundingModal.jsx'
import MarketplaceLayout from '../components/MarketplaceLayout.jsx'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import './Marketplace.css'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function formatDate(date) {
  if (!date) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

function LoanDetailsPage() {
  const { loanId } = useParams()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fundingOpen, setFundingOpen] = useState(false)

  const applyLoanUpdate = useCallback((updatedLoan) => {
    if (updatedLoan?._id === loanId) setLoan(updatedLoan)
  }, [loanId])

  useEffect(() => {
    let active = true

    loanApi.getMarketplaceLoan(loanId)
      .then(({ data }) => {
        if (active) setLoan(data.data.loan)
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'We couldn’t load this loan request. Please try again.',
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

  usePeerLendSocket({
    loanUpdated: ({ loan: updatedLoan }) => {
      if (updatedLoan?._id) applyLoanUpdate(updatedLoan)
    },
    loanFunded: ({ loan: updatedLoan }) => {
      if (updatedLoan?._id) applyLoanUpdate(updatedLoan)
    },
  })

  const fundedAmount = Number(loan?.fundedAmount) || 0
  const amount = Number(loan?.amount) || 0
  const progress = amount > 0 ? Math.min(100, Math.round((fundedAmount / amount) * 100)) : 0

  return (
    <MarketplaceLayout>
      <section className="marketplace-shell loan-details-shell">
        <Link className="loan-back-link" to="/marketplace">← Back to marketplace</Link>
        {loading ? (
          <div className="marketplace-loading" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading loan details…</p>
          </div>
        ) : error ? (
          <div className="marketplace-empty">
            <AuthMessage>{error}</AuthMessage>
            <h2>This request isn’t available.</h2>
            <p>It may have changed status or is no longer available in the marketplace.</p>
            <Link className="button button-outline" to="/marketplace">Return to Marketplace</Link>
          </div>
        ) : loan ? (
          <>
            <div className="details-title-row">
              <div>
                <p className="section-eyebrow">Marketplace request</p>
                <h1>{loan.purpose}</h1>
                <p>Requested by {loan.borrower?.name || 'PeerLend borrower'}</p>
              </div>
              <span className={`loan-status status-${loan.status.toLowerCase()}`}>{loan.status.toLowerCase()}</span>
            </div>
            <div className="loan-details-grid">
              <article className="loan-details-main">
                <p className="details-label">About this request</p>
                <p className="loan-details-description">{loan.description}</p>
                <div className="details-funding">
                  <div className="details-funding-heading">
                    <span>Funding progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div
                    className="market-progress-track details-progress-track"
                    role="progressbar"
                    aria-label="Loan funding progress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progress}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="details-amount-grid">
                    <div><span>Requested</span><strong>{currencyFormatter.format(amount)}</strong></div>
                    <div><span>Funded</span><strong>{currencyFormatter.format(fundedAmount)}</strong></div>
                    <div><span>Remaining</span><strong>{currencyFormatter.format(Number(loan.remainingAmount) || 0)}</strong></div>
                  </div>
                </div>
              </article>
              <aside className="loan-details-sidebar">
                <p className="details-label">Request details</p>
                <dl className="details-list">
                  <div><dt>Borrower</dt><dd>{loan.borrower?.name || 'PeerLend borrower'}</dd></div>
                  <div><dt>Duration</dt><dd>{loan.duration} {loan.duration === 1 ? 'month' : 'months'}</dd></div>
                  <div><dt>Repayment frequency</dt><dd>{loan.repaymentFrequency.toLowerCase().replace('biweekly', 'every two weeks')}</dd></div>
                  <div><dt>Status</dt><dd>{loan.status.toLowerCase()}</dd></div>
                  <div><dt>Submitted</dt><dd>{formatDate(loan.createdAt)}</dd></div>
                  <div><dt>Due date</dt><dd>{formatDate(loan.dueDate)}</dd></div>
                </dl>
                <button
                  className="button button-primary details-fund-button"
                  type="button"
                  onClick={() => setFundingOpen(true)}
                  disabled={Number(loan.remainingAmount) <= 0 || !['APPROVED', 'FUNDING'].includes(loan.status)}
                >
                  Fund Loan
                </button>
                <p className="details-funding-note">Demo only. No real money will move.</p>
              </aside>
            </div>
            {fundingOpen && (
              <FundingModal
                loan={loan}
                onClose={() => setFundingOpen(false)}
                onFunded={applyLoanUpdate}
              />
            )}
          </>
        ) : (
          <div className="marketplace-empty">
            <h2>This request isn’t available.</h2>
            <Link className="button button-outline" to="/marketplace">Return to Marketplace</Link>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  )
}

export default LoanDetailsPage
