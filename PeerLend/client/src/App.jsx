import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from './hooks/useAuth.js'
import './App.css'

export const Icon = ({ name, size = 22, className = '' }) => {
  const paths = {
    arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></>,
    hand: <><path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v9-7a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3 13a2 2 0 0 1 3-2.6L8 12Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-7 8-16Z" /><path d="M4 21c2-5 5-8 11-11" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    circleCheck: <><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const navLinks = [
  ['How It Works', '#how-it-works'],
  ['For Borrowers', '#for-borrowers'],
  ['For Lenders', '#for-lenders'],
  ['Benefits', '#benefits'],
  ['FAQ', '#faq'],
]

function Button({ href, children, variant = 'primary', icon, className = '' }) {
  return (
    <Link className={`button button-${variant} ${className}`} to={href}>
      {children}
      {icon && <Icon name={icon} size={16} />}
    </Link>
  )
}

function Logo() {
  return (
    <Link className="brand" to="/#home" aria-label="PeerLend home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7 24V8h9.5a5.5 5.5 0 0 1 0 11H12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m19 19 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-word">Peer<span>Lend</span></span>
    </Link>
  )
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  function handleLogout() {
    logout()
    closeMenu()
  }

  function renderAccountActions(mobile = false) {
    if (loading) return null

    if (user) {
      return (
        <>
          <Button href="/dashboard" variant="outline" className={mobile ? 'mobile-dashboard' : 'nav-dashboard'}>
            Dashboard
          </Button>
          <button
            className={`button button-primary ${mobile ? 'mobile-logout' : 'nav-logout'}`}
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </>
      )
    }

    return (
      <>
        <Button href="/login" variant="quiet" className={mobile ? 'mobile-login' : ''}>Login</Button>
        <Button href="/register" className={mobile ? 'mobile-register' : 'nav-register'}>
          Register <Icon name="arrow" size={14} />
        </Button>
      </>
    )
  }

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Logo />
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
        </button>
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a className="nav-home" href="#home" onClick={closeMenu}>Home</a>
          {navLinks.map(([label, href]) => (
            <a href={href} key={href} onClick={closeMenu}>{label}</a>
          ))}
          <div className="mobile-nav-actions">
            {renderAccountActions(true)}
          </div>
        </nav>
        <div className="nav-actions">
          {renderAccountActions()}
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const { user } = useAuth()

  return (
    <section className="hero-section" id="home">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-layout page-shell">
        <div className="hero-copy">
          <div className="trust-label"><span className="trust-pulse" /> Lending, with people at the heart</div>
          <h1>Make room for<br />a <span>brighter</span> next.</h1>
          <p className="hero-tagline">Small Loans. Real People. Better Futures.</p>
          <p className="hero-description">
            A more human way to move forward. Connect with a community that
            believes good things happen when we help each other.
          </p>
          <div className="hero-actions">
            <Button href={user ? '/dashboard' : '/register'} icon="arrowRight">
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            <Button href="#for-borrowers" variant="outline">Explore Loans</Button>
          </div>
          <div className="hero-note">
            <span className="avatar-stack" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span>
            </span>
            <span>Built around people, not paperwork.</span>
          </div>
        </div>

        <div className="hero-art phone-showcase" role="img" aria-label="Illustrative preview of the PeerLend mobile app, with a community dashboard and a welcoming getting-started screen">
          <span className="phone-preview-label" aria-hidden="true">ILLUSTRATIVE APP PREVIEW</span>
          <div className="preview-phone preview-phone-dashboard" aria-hidden="true">
            <div className="preview-phone-screen">
              <div className="preview-status-bar"><span>9:41</span><span>● ︱◖</span></div>
              <div className="preview-phone-greeting">
                <span className="preview-profile-mark">P</span>
                <span><small>Good morning,</small><strong>Your next step.</strong></span>
                <span className="preview-add-mark">+</span>
              </div>
              <div className="preview-balance-card">
                <span className="preview-status-pill"><i /> Community</span>
                <small>Moving forward, together</small>
                <strong>Small steps.<br />Bright futures.</strong>
                <span className="preview-card-pattern" />
              </div>
              <div className="preview-section-heading">
                <strong>People helping people</strong>
                <span>See all</span>
              </div>
              <div className="preview-community-row">
                <span className="preview-community-avatar avatar-sun">✳</span>
                <span className="preview-community-avatar avatar-leaf"><Icon name="leaf" size={15} /></span>
                <span className="preview-community-avatar avatar-heart"><Icon name="heart" size={15} /></span>
                <span className="preview-community-avatar avatar-more">+</span>
              </div>
              <div className="preview-activity-card">
                <div className="preview-section-heading">
                  <strong>Your journey</strong>
                  <span>•••</span>
                </div>
                <div className="preview-activity-row">
                  <span className="preview-activity-icon"><Icon name="people" size={14} /></span>
                  <span><strong>Loan requests</strong><small>Take the next step</small></span>
                  <span className="preview-row-arrow">›</span>
                </div>
                <div className="preview-activity-row">
                  <span className="preview-activity-icon"><Icon name="heart" size={14} /></span>
                  <span><strong>Community support</strong><small>Real people, together</small></span>
                  <span className="preview-row-arrow">›</span>
                </div>
                <div className="preview-activity-row">
                  <span className="preview-activity-icon"><Icon name="spark" size={14} /></span>
                  <span><strong>Brighter futures</strong><small>Built one step at a time</small></span>
                  <span className="preview-row-arrow">›</span>
                </div>
              </div>
              <div className="preview-phone-tabs">
                <span className="is-selected"><i>⌂</i>Home</span>
                <span><i>♡</i>Community</span>
                <span><i>◷</i>Activity</span>
              </div>
            </div>
          </div>
          <div className="preview-phone preview-phone-welcome" aria-hidden="true">
            <div className="preview-phone-screen">
              <span className="preview-welcome-mark"><Icon name="people" size={19} /></span>
              <span className="preview-welcome-eyebrow">PEERLEND COMMUNITY</span>
              <strong className="preview-welcome-title">Get started.<br />Grow together.</strong>
              <span className="preview-welcome-copy">A little support can open up a world of possibility.</span>
              <span className="preview-welcome-art">
                <span className="preview-art-hill preview-art-hill-back" />
                <span className="preview-art-hill preview-art-hill-front" />
                <span className="preview-art-spark">✳</span>
                <span className="preview-art-leaf"><Icon name="leaf" size={30} /></span>
              </span>
              <span className="preview-welcome-button">Start your journey <span>→</span></span>
              <span className="preview-welcome-footer">SMALL LOANS. REAL PEOPLE.</span>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-bottom page-shell">
        <span>FINANCIAL WELLBEING, BUILT TOGETHER</span>
        <span className="hero-bottom-line" />
        <span>GOOD PEOPLE. REAL POSSIBILITY.</span>
      </div>
    </section>
  )
}

const steps = [
  {
    number: '01',
    icon: 'eye',
    title: 'Find your footing',
    text: 'Explore lending options and understand the path ahead, at your own pace.',
  },
  {
    number: '02',
    icon: 'people',
    title: 'Meet your community',
    text: 'Connect with people who want to make a positive difference together.',
  },
  {
    number: '03',
    icon: 'spark',
    title: 'Move forward',
    text: 'Take the next step with clear expectations and people in your corner.',
  },
]

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  return (
    <div className={`section-heading heading-${align}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  )
}

function HowItWorks() {
  return (
    <section className="section how-section" id="how-it-works">
      <div className="page-shell">
        <SectionHeading
          eyebrow="A clearer way forward"
          title={<>Good things happen<br className="desktop-break" /> <span>one step at a time.</span></>}
          description="A straightforward experience designed to put people first at every turn."
        />
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-card-top">
                <span className="step-icon"><Icon name={step.icon} size={21} /></span>
                <span className="step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <span className="step-card-line" aria-hidden="true" />
            </article>
          ))}
        </div>
        <p className="preview-disclaimer">
          PeerLend is a product preview. Applications and lending are not active yet.
        </p>
      </div>
    </section>
  )
}

function AudienceCard({ id, label, title, description, items, action, variant, icon, href = '/register' }) {
  return (
    <article className={`audience-card audience-${variant}`} id={id}>
      <div className="audience-card-head">
        <span className="audience-icon"><Icon name={icon} size={22} /></span>
        <span className="audience-label">{label}</span>
      </div>
      <h3>{title}</h3>
      <p className="audience-description">{description}</p>
      <ul className="audience-list">
        {items.map((item) => (
          <li key={item}><Icon name="circleCheck" size={17} />{item}</li>
        ))}
      </ul>
      <Button href={href} variant={variant === 'dark' ? 'light' : 'outline'} icon="arrowRight">
        {action}
      </Button>
    </article>
  )
}

function ForEveryone() {
  return (
    <section className="section audience-section">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Room for everyone"
          title={<>Your next step. <span>Your way.</span></>}
          description="Whether you need a hand or want to lend one, you belong here."
        />
        <div className="audience-grid">
          <AudienceCard
            id="for-borrowers"
            label="For borrowers"
            title={<>A little breathing<br />room can go a long way.</>}
            description="Explore a more thoughtful borrowing experience, with clarity and community beside you."
            items={['Understand your options clearly', 'Move at a pace that feels right', 'Be treated like a person, always']}
            action="Explore Loans"
            variant="light"
            icon="hand"
            href="#loan-examples"
          />
          <AudienceCard
            id="for-lenders"
            label="For lenders"
            title={<>Be part of someone’s<br />next chapter.</>}
            description="Put the power of community behind real people taking meaningful steps forward."
            items={['Support real people and goals', 'See the bigger picture', 'Make a difference together']}
            action="Become a Lender"
            variant="dark"
            icon="heart"
          />
        </div>
      </div>
    </section>
  )
}

const loanExamples = [
  {
    category: 'Education',
    amount: '$800',
    title: 'Course and study materials',
    description: 'Example: explain the course fees or learning supplies the loan would help cover.',
  },
  {
    category: 'Health',
    amount: '$500',
    title: 'Medical and care expenses',
    description: 'Example: outline an upcoming appointment, treatment, or essential care expense.',
  },
  {
    category: 'Farming',
    amount: '$650',
    title: 'Seeds and seasonal supplies',
    description: 'Example: describe the farming supplies needed for the next planting season.',
  },
  {
    category: 'Small business',
    amount: '$1,000',
    title: 'Business stock and tools',
    description: 'Example: share how inventory or a practical tool could support your work.',
  },
]

function LoanExamples() {
  return (
    <section className="section loan-examples-section" id="loan-examples">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Ideas for your request"
          title={<>A few examples to <span>get you started.</span></>}
          description="Use these sample scenarios for inspiration when describing what you need and how the loan could help."
        />
        <div className="loan-examples-grid">
          {loanExamples.map((example) => (
            <article className="loan-example-card" key={example.category}>
              <div className="loan-example-topline">
                <span>{example.category}</span>
                <strong>{example.amount}</strong>
              </div>
              <h3>{example.title}</h3>
              <p>{example.description}</p>
            </article>
          ))}
        </div>
        <p className="loan-examples-disclaimer">
          These are illustrative examples only—not real loan requests, offers, or recommended amounts.
        </p>
        <div className="loan-examples-action">
          <Button href="/register" icon="arrowRight">Create Your Request</Button>
        </div>
      </div>
    </section>
  )
}

const benefits = [
  {
    icon: 'shield',
    title: 'Clarity at every step',
    text: 'Plain-language guidance helps you understand what comes next, without the guesswork.',
  },
  {
    icon: 'people',
    title: 'People over paperwork',
    text: 'A community-first approach puts real lives and real circumstances in the conversation.',
  },
  {
    icon: 'eye',
    title: 'Transparency that matters',
    text: 'Clear expectations are the start of a more confident financial relationship.',
  },
  {
    icon: 'heart',
    title: 'A little goes a long way',
    text: 'Every connection is a chance to help someone take a step toward what’s next.',
  },
]

function Benefits() {
  return (
    <section className="section benefits-section" id="benefits">
      <div className="page-shell benefits-layout">
        <div className="benefits-intro">
          <SectionHeading
            align="left"
            eyebrow="The PeerLend difference"
            title={<>Finance should feel a little more <span>human.</span></>}
            description="We're building a space where financial support starts with understanding—and grows through community."
          />
          <Button href="/register" variant="outline" icon="arrowRight">Discover PeerLend</Button>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit, index) => (
            <article className="benefit-item" key={benefit.title}>
              <span className={`benefit-icon benefit-icon-${index + 1}`}><Icon name={benefit.icon} size={20} /></span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const principles = [
  ['01', 'People first', 'A person is never just a number.'],
  ['02', 'Clear by design', 'Make the next step easier to understand.'],
  ['03', 'Better together', 'Progress means more when we share it.'],
]

function Statistics() {
  return (
    <section className="principles-section" aria-labelledby="principles-title">
      <div className="page-shell">
        <div className="principles-heading">
          <div>
            <p className="section-eyebrow">What we stand for</p>
            <h2 id="principles-title">A better measure<br />of <span>what matters.</span></h2>
          </div>
          <p>Our north stars aren’t big numbers. They’re the little things that help people feel seen, supported, and ready for what’s next.</p>
        </div>
        <div className="principles-grid">
          {principles.map(([number, title, text]) => (
            <article className="principle" key={number}>
              <span className="principle-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className="principles-note">PeerLend is in development. These are guiding principles, not live platform statistics.</p>
      </div>
    </section>
  )
}

const faqs = [
  {
    question: 'What is PeerLend?',
    answer: 'PeerLend is being designed as a community-powered lending experience that brings people together around small loans, clear information, and a more human approach to financial wellbeing.',
  },
  {
    question: 'Is PeerLend available to borrow or lend through today?',
    answer: 'Not yet. This is an early product preview. Applications, lending, payments, and account access are not active on this page.',
  },
  {
    question: 'Who is PeerLend for?',
    answer: 'PeerLend is being created for people looking for a more supportive borrowing experience and for people who want to help others move forward.',
  },
  {
    question: 'How does PeerLend keep things transparent?',
    answer: 'Clarity is a core design principle. As the product develops, we aim to explain each step in plain language so people can make informed decisions.',
  },
]

function FAQ() {
  return (
    <section className="section faq-section" id="faq">
      <div className="page-shell faq-layout">
        <div className="faq-intro">
          <p className="section-eyebrow">Questions, meet answers</p>
          <h2>Curious?<br /><span>We’re glad.</span></h2>
          <p>Here are a few things people often ask about PeerLend.</p>
          <a className="faq-contact" href="mailto:hello@peerlend.example">Still have a question? <span>Say hello <Icon name="arrow" size={14} /></span></a>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details className="faq-item" key={faq.question} open={index === 0}>
              <summary>{faq.question}<span className="faq-plus" aria-hidden="true" /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section className="cta-section page-shell" id="get-started">
      <div className="cta-card">
        <div className="cta-decoration cta-decoration-one" aria-hidden="true" />
        <div className="cta-decoration cta-decoration-two" aria-hidden="true" />
        <div className="cta-content">
          <p className="section-eyebrow">A better future is built together</p>
          <h2>Ready when<br />you are.</h2>
          <p>We’re getting things ready. PeerLend is a preview today, with a more human way to lend on the horizon.</p>
          <div className="cta-actions">
            <Button href="/register" variant="light" icon="arrowRight">Get Started</Button>
            <Button href="/#faq" variant="cta-outline">Explore FAQs</Button>
          </div>
          <span className="cta-preview-note">Sign-in and lending are not available in this preview.</span>
        </div>
        <div className="cta-art" aria-hidden="true">
          <div className="cta-ring cta-ring-one" />
          <div className="cta-ring cta-ring-two" />
          <div className="cta-leaf"><Icon name="leaf" size={66} /></div>
          <span className="cta-star cta-star-one">✳</span>
          <span className="cta-star cta-star-two">✳</span>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-main">
        <div className="footer-brand">
          <Logo />
          <p>Small Loans. Real People.<br />Better Futures.</p>
        </div>
        <div className="footer-links">
          <div>
            <span className="footer-heading">Discover</span>
            <a href="#how-it-works">How It Works</a>
            <a href="#benefits">Benefits</a>
            <a href="#faq">FAQs</a>
          </div>
          <div>
            <span className="footer-heading">For you</span>
            <a href="#for-borrowers">Borrowers</a>
            <a href="#for-lenders">Lenders</a>
            <a href="#get-started">Get started</a>
          </div>
          <div>
            <span className="footer-heading">Say hello</span>
            <a href="mailto:hello@peerlend.example">Contact PeerLend</a>
            <span className="footer-coming-soon">More ways to connect soon</span>
          </div>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© 2026 PeerLend. Built on trust, powered by community.</span>
        <span className="footer-preview"><span /> Product preview · Not a live lending service</span>
      </div>
    </footer>
  )
}

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ForEveryone />
        <LoanExamples />
        <Benefits />
        <Statistics />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}

export default App
