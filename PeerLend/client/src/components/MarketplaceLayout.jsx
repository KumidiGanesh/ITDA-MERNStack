import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './Brand.jsx'
import AppBottomNav from './AppBottomNav.jsx'
import NotificationBell from './NotificationBell.jsx'
import useAuth from '../hooks/useAuth.js'

function MarketplaceLayout({ children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { notice: 'You have been signed out.' } })
  }

  return (
    <main className="marketplace-page">
      <header className="dashboard-nav">
        <Logo home />
        <nav className="loan-nav-links" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link className="loan-nav-active" to="/marketplace">Marketplace</Link>
          <Link to="/transactions">Transactions</Link>
          <NotificationBell />
          <button className="button dashboard-logout" type="button" onClick={handleLogout}>Log out</button>
        </nav>
      </header>
      {children}
      <AppBottomNav />
    </main>
  )
}

export default MarketplaceLayout
