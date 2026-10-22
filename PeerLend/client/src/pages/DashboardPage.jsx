import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Brand.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import AuthMessage from '../components/AuthMessage.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import useAuth from '../hooks/useAuth.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import { Icon } from '../App.jsx'
import './AuthPages.css'
import './DashboardVisuals.css'

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [liveNotice, setLiveNotice] = useState('')
  const initials = getInitials(user.name)

  usePeerLendSocket({
    notificationCreated: (event) => {
      if (event?.message) setLiveNotice(event.message)
    },
  })

  function handleLogout() {
    logout()
    navigate('/login', {
      replace: true,
      state: { notice: 'You have been signed out.' },
    })
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-nav">
        <Logo home />
        <div className="dashboard-user">
          <NotificationBell />
          <Link className="dashboard-transactions-link" to="/transactions">Transactions</Link>
          <span className="dashboard-profile-avatar" aria-label={`Profile initials ${initials}`}>
            {initials}
          </span>
          <div className="dashboard-user-copy">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="button dashboard-logout" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <section className="dashboard-main">
        <div className="dashboard-greeting">
          <div>
            <p className="section-eyebrow">Your PeerLend space</p>
            <h1>Welcome, {user.name.split(' ')[0]}.</h1>
          </div>
          <p>A community-first financial experience, with you at the center.</p>
        </div>
        {liveNotice && <AuthMessage type="notice">{liveNotice}</AuthMessage>}
        <article className="dashboard-preview-card">
          <div>
            <p className="section-eyebrow">Account overview</p>
            <h2>Your next chapter starts here.</h2>
            <p>
              Your PeerLend account is ready. Create a loan request or review the
              requests you’ve already submitted.
            </p>
            {['borrower', 'both'].includes(user.role) && (
              <div className="dashboard-loan-actions">
                <Link className="button button-primary" to="/loans/new">Create Loan Request <span aria-hidden="true">→</span></Link>
                <Link className="button button-outline" to="/my-loans">My Loans</Link>
              </div>
            )}
            {['lender', 'both'].includes(user.role) && (
              <div className="dashboard-loan-actions">
                <Link className="button button-primary" to="/marketplace">Explore Marketplace <span aria-hidden="true">→</span></Link>
              </div>
            )}
          </div>
          <span className="dashboard-preview-icon"><Icon name="people" size={31} /></span>
        </article>
        <section className="dashboard-visual-grid" aria-label="PeerLend community and account guidance">
          <article className="dashboard-community-visual">
            <div className="dashboard-visual-copy">
              <p className="section-eyebrow">People helping people</p>
              <h2>Good things grow together.</h2>
              <p>A simple illustration of the people-powered idea behind PeerLend.</p>
            </div>
            <div className="dashboard-peer-illustration" role="img" aria-label="Illustration of a lender sharing support with a borrower">
              <div className="dashboard-person-badge dashboard-person-current">{initials}</div>
              <div className="dashboard-support-path"><span className="dashboard-support-coin">$</span></div>
              <div className="dashboard-person-badge dashboard-person-community" aria-hidden="true">
                <Icon name="people" size={20} />
              </div>
              <span className="dashboard-person-caption dashboard-caption-current">You</span>
              <span className="dashboard-person-caption dashboard-caption-community">Community</span>
            </div>
            <span className="dashboard-illustration-disclaimer">Concept illustration · no funds are shown or transferred</span>
          </article>
          <article className="dashboard-progress-visual">
            <div>
              <p className="section-eyebrow">A brighter next</p>
              <h2>Progress, one step at a time.</h2>
              <p>Your loan and repayment activity appears in its dedicated sections.</p>
            </div>
            <div className="dashboard-growth-chart" role="img" aria-label="Illustrative upward path representing personal progress, not account or loan data">
              <span className="dashboard-chart-label">An illustrative path</span>
              <svg viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="dashboard-growth-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#51e79e" stopOpacity=".25" />
                    <stop offset="100%" stopColor="#51e79e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="dashboard-growth-area" d="M0 100 C42 95 46 72 86 79 S130 92 164 59 S220 67 247 37 S288 36 320 9 V120 H0Z" />
                <path className="dashboard-growth-line" d="M0 100 C42 95 46 72 86 79 S130 92 164 59 S220 67 247 37 S288 36 320 9" />
                <circle cx="86" cy="79" r="4" />
                <circle cx="164" cy="59" r="4" />
                <circle cx="247" cy="37" r="4" />
                <circle cx="320" cy="9" r="4" />
              </svg>
              <span className="dashboard-chart-leaf" aria-hidden="true"><Icon name="leaf" size={19} /></span>
            </div>
          </article>
          <article className="dashboard-account-care">
            <span className="dashboard-account-care-icon" aria-hidden="true"><Icon name="shield" size={24} /></span>
            <div>
              <p className="section-eyebrow">A thoughtful start</p>
              <h2>Keep your account details private.</h2>
              <p>Use a strong password and never share your sign-in details.</p>
            </div>
          </article>
        </section>
        <p className="dashboard-preview-note">
          Signed in as {user.email} · Your role: {user.role}
        </p>
      </section>
      <AppBottomNav />
    </main>
  )
}

export default DashboardPage
