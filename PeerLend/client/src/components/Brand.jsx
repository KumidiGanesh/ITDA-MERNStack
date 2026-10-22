import { Link } from 'react-router-dom'

function Brand({ home = false }) {
  return (
    <Link className="brand" to={home ? '/#home' : '/'} aria-label="PeerLend home">
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

export { Brand as Logo }
export default Brand
