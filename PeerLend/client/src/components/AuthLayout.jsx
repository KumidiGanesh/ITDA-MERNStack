import { Logo } from './Brand.jsx'
import '../pages/AuthPages.css'

function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Logo />
        <div className="auth-aside-art" aria-hidden="true" />
        <div className="auth-aside-copy">
          <p className="section-eyebrow">Small Loans. Real People. Better Futures.</p>
          <h1>Good things grow<br />when we <span>show up.</span></h1>
          <p>
            PeerLend is a community-first approach to moving forward. We’re glad
            you’re here.
          </p>
        </div>
        <span className="auth-aside-foot">Built on trust. Powered by community.</span>
      </aside>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><Logo /></div>
          <div className="auth-heading">
            <p className="section-eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
