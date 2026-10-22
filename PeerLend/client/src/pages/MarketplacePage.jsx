import { useCallback, useEffect, useState } from 'react'
import AuthMessage from '../components/AuthMessage.jsx'
import FundingModal from '../components/FundingModal.jsx'
import LoanCard from '../components/LoanCard.jsx'
import MarketplaceLayout from '../components/MarketplaceLayout.jsx'
import useAuth from '../hooks/useAuth.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { getApiErrorMessage, loanApi } from '../services/api.js'
import './Marketplace.css'

function MarketplacePage() {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fundingLoan, setFundingLoan] = useState(null)
  const [notification, setNotification] = useState('')
  const [paymentActivity, setPaymentActivity] = useState([])

  const applyLoanUpdate = useCallback((updatedLoan) => {
    if (updatedLoan.borrower?._id === user.id || updatedLoan.borrower?._id === user._id) {
      return
    }

    setLoans((currentLoans) => {
      if (!['APPROVED', 'FUNDING'].includes(updatedLoan.status)) {
        return currentLoans.filter((loan) => loan._id !== updatedLoan._id)
      }

      const alreadyListed = currentLoans.some((loan) => loan._id === updatedLoan._id)
      if (!alreadyListed) return [updatedLoan, ...currentLoans]

      return currentLoans.map((loan) => (
        loan._id === updatedLoan._id ? updatedLoan : loan
      ))
    })
    setFundingLoan((currentLoan) => (
      currentLoan?._id === updatedLoan._id ? updatedLoan : currentLoan
    ))
  }, [user.id, user._id])

  useEffect(() => {
    let active = true

    loanApi.getMarketplace()
      .then(({ data }) => {
        if (active) setLoans(data.data.loans)
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'We couldn’t load the marketplace. Please try again.',
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

  const { connectionError } = usePeerLendSocket({
    loanCreated: ({ loan }) => {
      if (loan?._id) applyLoanUpdate(loan)
    },
    loanUpdated: ({ loan }) => {
      if (loan?._id) applyLoanUpdate(loan)
    },
    loanFunded: ({ loan }) => {
      if (loan?._id) applyLoanUpdate(loan)
    },
    paymentReceived: (event) => {
      if (event?.loan && event?.transaction) {
        setPaymentActivity((current) => [
          event,
          ...current.filter((item) => item.transaction?._id !== event.transaction._id),
        ].slice(0, 4))
      }
    },
    notificationCreated: (event) => {
      if (event?.message) setNotification(event.message)
    },
  })

  async function handleRetry() {
    setError('')
    setLoading(true)
    try {
      const { data } = await loanApi.getMarketplace()
      setLoans(data.data.loans)
    } catch (requestError) {
      setError(getApiErrorMessage(
        requestError,
        'We couldn’t load the marketplace. Please try again.',
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketplaceLayout>
      <section className="marketplace-hero">
        <div className="marketplace-shell marketplace-hero-inner">
          <div>
            <p className="section-eyebrow">The PeerLend community</p>
            <h1>A little support.<br /><span>A lot of possibility.</span></h1>
            <p>Explore requests from real people taking their next step. Every listing here comes from the PeerLend community.</p>
          </div>
          <div className="marketplace-hero-art" aria-hidden="true">
            <span className="marketplace-art-orbit" />
            <span className="marketplace-art-orbit marketplace-art-orbit-inner" />
            <span className="marketplace-art-leaf">✳</span>
            <span className="marketplace-art-label">Good grows<br />together.</span>
          </div>
        </div>
      </section>

      <section className="marketplace-shell marketplace-content" aria-labelledby="marketplace-title">
        <div className="marketplace-heading">
          <div>
            <p className="section-eyebrow">Open opportunities</p>
            <h2 id="marketplace-title">Loan Marketplace</h2>
            <p>Requests approved for community funding are shown here.</p>
          </div>
          {!loading && !error && (
            <span className="marketplace-count">{loans.length} {loans.length === 1 ? 'request' : 'requests'}</span>
          )}
        </div>

        {error && <AuthMessage>{error}</AuthMessage>}
        {notification && <AuthMessage type="notice">{notification}</AuthMessage>}
        {connectionError && <AuthMessage>{connectionError}</AuthMessage>}
        {paymentActivity.length > 0 && (
          <section className="market-live-activity" aria-label="Recent simulated repayment activity">
            <div>
              <p className="section-eyebrow">Live lender activity</p>
              <h3>Recent repayments</h3>
            </div>
            <div className="market-live-activity-list">
              {paymentActivity.map(({ loan, transaction }) => (
                <article key={transaction._id}>
                  <span>Simulated repayment · {loan.purpose}</span>
                  <strong>${Number(transaction.amount).toFixed(2)}</strong>
                </article>
              ))}
            </div>
          </section>
        )}
        {loading ? (
          <div className="marketplace-loading" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Finding available requests…</p>
          </div>
        ) : error ? (
          <div className="marketplace-empty">
            <span className="marketplace-empty-mark" aria-hidden="true">↻</span>
            <h3>We couldn’t load the marketplace.</h3>
            <p>Please check your connection and try again.</p>
            <button className="button button-outline" type="button" onClick={handleRetry}>Try again</button>
          </div>
        ) : loans.length === 0 ? (
          <div className="marketplace-empty">
            <span className="marketplace-empty-mark" aria-hidden="true">✳</span>
            <h3>New possibilities are on their way.</h3>
            <p>There are no approved loan requests available right now. Check back as the community grows.</p>
          </div>
        ) : (
          <div className="marketplace-grid">
            {loans.map((loan) => (
              <LoanCard loan={loan} key={loan._id} onFund={setFundingLoan} />
            ))}
          </div>
        )}

        <p className="marketplace-disclaimer">
          PeerLend is a product preview. Funding is simulated only; no real money moves and listings are not offers to lend.
        </p>
      </section>
      {fundingLoan && (
        <FundingModal
          loan={fundingLoan}
          onClose={() => setFundingLoan(null)}
          onFunded={applyLoanUpdate}
        />
      )}
    </MarketplaceLayout>
  )
}

export default MarketplacePage
