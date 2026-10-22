import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

function AppBottomNav() {
  const { user } = useAuth()
  const links = [
    { to: '/dashboard', label: 'Home', icon: '⌂' },
    ...(['borrower', 'both'].includes(user.role)
      ? [{ to: '/my-loans', label: 'My Loans', icon: '◉' }]
      : []),
    ...(['lender', 'both'].includes(user.role)
      ? [{ to: '/marketplace', label: 'Explore', icon: '↗' }]
      : []),
    { to: '/transactions', label: 'Activity', icon: '≡' },
  ]

  return (
    <nav className="app-bottom-nav" aria-label="Main account navigation">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) => `app-bottom-nav-link${isActive ? ' is-active' : ''}`}
        >
          <span className="app-bottom-nav-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default AppBottomNav
