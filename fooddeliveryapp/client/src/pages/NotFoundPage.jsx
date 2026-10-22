import { Link } from "react-router-dom";

function NotFoundPage() {
  return <section className="empty-page"><p className="eyebrow">404</p><h1>Page not found.</h1><Link to="/">Return home</Link></section>;
}

export default NotFoundPage;
