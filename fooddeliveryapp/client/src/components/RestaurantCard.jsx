import { Link } from "react-router-dom";
import { formatINR } from "../utils/currency";

function RestaurantCard({ restaurant }) {
  const cuisineEmoji = {
    Italian: "🍝",
    Mexican: "🌮",
    Indian: "🍛",
    Chinese: "🥡",
    Japanese: "🍣",
    Burger: "🍔",
    Pizza: "🍕",
    Coffee: "☕",
    Bakery: "🥐",
    Seafood: "🦐",
  };

  const firstLetter = restaurant.cuisine?.slice(0, 1) || "F";
  const emoji = cuisineEmoji[restaurant.cuisine] || firstLetter;

  const imageSrc = restaurant.image || "";

  return (
    <Link className="restaurant-card" to={`/restaurants/${restaurant._id}`}>
      {imageSrc ? (
        <img className="restaurant-image" src={imageSrc} alt={restaurant.name} />
      ) : (
        <div className="restaurant-image" aria-label={restaurant.name}>{emoji}</div>
      )}
      <div className="card-body">
        <div className="card-title-row">
          <h2>{restaurant.name}</h2>
          <span className="rating">★ {Number(restaurant.rating || 0).toFixed(1)}</span>
        </div>
        <div className="tag-row">
          <span className="tag-pill">{restaurant.cuisine || "Local favorite"}</span>
          <span className="tag-pill tag-muted">30-40 min</span>
        </div>
        <p>{restaurant.description || "Fresh ingredients and bold flavors."}</p>
        <div className="card-footer-row">
          <small>{restaurant.address || "Delivery available"}</small>
          {restaurant.priceFrom !== null && restaurant.priceFrom !== undefined && (
            <strong className="price-from">From {formatINR(restaurant.priceFrom)}</strong>
          )}
        </div>
      </div>
    </Link>
  );
}

export default RestaurantCard;
