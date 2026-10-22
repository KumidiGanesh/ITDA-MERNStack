import { useEffect, useState } from "react";
import { list, search } from "../api/restaurantApi";
import RestaurantCard from "../components/RestaurantCard";

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = query.trim()
          ? await search({ q: query.trim(), page, limit: 10 })
          : await list({ page, limit: 10 });
        setRestaurants(response.data || []);
        setTotalPages(response.totalPages || 1);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Restaurants could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query, page]);

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  return (
    <section className="page-section landing-page">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="hero-chip">India's favourite food delivery</span>
          <h1>Discover the best food & drinks in your city</h1>
          <p className="muted">Order from the best local restaurants, cafes and kitchens near you.</p>
          <div className="cta-row">
            <button type="button" className="primary-btn">Order now</button>
            <button type="button" className="secondary-btn">Explore restaurants</button>
          </div>
          <div className="stat-grid">
            <div>
              <strong>10k+</strong>
              <span>happy orders</span>
            </div>
            <div>
              <strong>25 min</strong>
              <span>avg delivery</span>
            </div>
            <div>
              <strong>4.8/5</strong>
              <span>food rating</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-one">
            <span className="mini-label">Popular today</span>
            <h3>Fire Bowl</h3>
            <p>Grilled chicken • rice • spicy sauce</p>
            <strong>4.8 ★ &nbsp; ₹899</strong>
          </div>
          <div className="feature-badge">Free delivery over ₹499</div>
          <div className="hero-plate">🍜</div>
        </div>
      </div>

      <div className="promo-row">
        <span>🍕 Pizza</span>
        <span>🍔 Burgers</span>
        <span>🍛 Biryani</span>
        <span>☕ Cafes</span>
        <span>🍰 Desserts</span>
        <span>🥗 Healthy food</span>
      </div>

      <div className="page-heading home-heading">
        <div>
          <p className="eyebrow">Top restaurants for you</p>
          <h2>Order food online</h2>
        </div>
        <label className="search-label">
          <span>Search for restaurant, cuisine or a dish</span>
          <div className="search-input-wrap">
            <span>⌕</span>
            <input value={query} onChange={handleSearchChange} placeholder="Search for restaurant, cuisine or a dish" />
          </div>
        </label>
      </div>

      {loading && <div className="loading-state"><span className="spinner" />Loading restaurants...</div>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <>
          <div className="card-grid">
            {restaurants.map((restaurant) => <RestaurantCard key={restaurant._id} restaurant={restaurant} />)}
          </div>
          {restaurants.length === 0 && <p className="muted">No restaurants match your search.</p>}
          <div className="pagination" aria-label="Restaurant pagination">
            <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}

export default Home;
