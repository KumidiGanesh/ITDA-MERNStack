import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { list } from "../api/restaurantApi";

function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    list()
      .then((response) => setRestaurants(response.data || []))
      .catch(() => setError("Restaurants could not be loaded right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Food Delivery Mini App</p>
          <h1>Find your next favorite meal.</h1>
          <p className="muted">Browse local restaurants and order something delicious.</p>
        </div>
      </div>
      {loading && <p className="muted">Loading restaurants...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <div className="card-grid">
          {restaurants.map((restaurant) => (
            <Link className="restaurant-card" to={`/restaurants/${restaurant._id}`} key={restaurant._id}>
              <div className="restaurant-image">{restaurant.cuisine?.slice(0, 1) || "F"}</div>
              <div className="card-body">
                <h2>{restaurant.name}</h2>
                <p>{restaurant.description || restaurant.cuisine || "Local favorite"}</p>
                <small>{restaurant.address || "Delivery available"}</small>
              </div>
            </Link>
          ))}
          {restaurants.length === 0 && <p className="muted">No restaurants have been added yet.</p>}
        </div>
      )}
    </section>
  );
}

export default HomePage;
