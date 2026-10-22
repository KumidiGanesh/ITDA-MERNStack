import { Link } from 'react-router-dom'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function LoanCard({ loan, onFund }) {
  const fundedAmount = Number(loan.fundedAmount) || 0
  const amount = Number(loan.amount) || 0
  const remainingAmount = Number(loan.remainingAmount) || 0
  const progress = amount > 0
    ? Math.min(100, Math.max(0, Math.round((fundedAmount / amount) * 100)))
    : 0
  const borrowerName = loan.borrower?.name || 'PeerLend borrower'

  return (
    <article className="market-loan-card">
      <div className="market-card-top">
        <div className="market-borrower">
          <span className="borrower-avatar" aria-hidden="true">
            {borrowerName.trim().charAt(0).toUpperCase()}
          </span>
          <span>
            <small>Borrower</small>
            <strong>{borrowerName}</strong>
          </span>
        </div>
        <span className={`loan-status status-${loan.status.toLowerCase()}`}>
          {loan.status.toLowerCase()}
        </span>
      </div>

      <p className="market-purpose-label">Loan purpose</p>
      <h2 className="market-purpose">{loan.purpose}</h2>
      <p className="market-description">{loan.description}</p>

      <div className="market-amounts">
        <div>
          <span>Requested</span>
          <strong>{currencyFormatter.format(amount)}</strong>
        </div>
        <div>
          <span>Funded</span>
          <strong>{currencyFormatter.format(fundedAmount)}</strong>
        </div>
        <div>
          <span>Remaining</span>
          <strong>{currencyFormatter.format(remainingAmount)}</strong>
        </div>
      </div>

      <div className="market-progress">
        <div className="market-progress-heading">
          <span>Funding progress</span>
          <strong>{progress}%</strong>
        </div>
        <div
          className="market-progress-track"
          role="progressbar"
          aria-label={`${loan.purpose} funding progress`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="market-card-meta">
        <span>{loan.duration} {loan.duration === 1 ? 'month' : 'months'}</span>
        <span>{loan.repaymentFrequency.toLowerCase().replace('biweekly', 'every two weeks')}</span>
      </div>

      <div className="market-card-actions">
        <Link className="button button-outline" to={`/marketplace/${loan._id}`}>
          View Details <span aria-hidden="true">→</span>
        </Link>
        <button
          className="button market-fund-button"
          type="button"
          onClick={() => onFund(loan)}
          disabled={remainingAmount <= 0}
          aria-label={`Fund Loan for ${loan.purpose}`}
        >
          Fund Loan
        </button>
      </div>
    </article>
  )
}

export default LoanCard
