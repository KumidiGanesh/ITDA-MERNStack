import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getById } from "../api/restaurantApi";
import { list as listMenuItems } from "../api/menuItemApi";
import { formatINR } from "../utils/currency";

function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getById(id), listMenuItems({ restaurant: id })])
      .then(([restaurantResponse, menuResponse]) => {
        setRestaurant(restaurantResponse.data);
        setMenuItems(menuResponse.data || []);
      })
      .catch(() => setError("This restaurant could not be loaded."));
  }, [id]);

  if (error) return <section className="page-section"><p className="error-message">{error}</p><Link to="/">Back home</Link></section>;
  if (!restaurant) return <section className="page-section"><p className="muted">Loading menu...</p></section>;

  return (
    <section className="page-section">
      <Link className="back-link" to="/">&larr; All restaurants</Link>
      <div className="detail-heading">
        <p className="eyebrow">{restaurant.cuisine || "Restaurant"}</p>
        <h1>{restaurant.name}</h1>
        <p className="muted">{restaurant.description || restaurant.address}</p>
      </div>
      <h2 className="section-title">Menu</h2>
      <div className="menu-list">
        {menuItems.map((item) => (
          <article className="menu-item" key={item._id}>
            <div><h3>{item.name}</h3><p>{item.description || "Freshly prepared for you."}</p></div>
            <strong>{formatINR(item.price)}</strong>
          </article>
        ))}
        {menuItems.length === 0 && <p className="muted">No menu items are available yet.</p>}
      </div>
    </section>
  );
}

export default RestaurantDetailPage;
