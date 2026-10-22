import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getById } from "../api/restaurantApi";
import { list as listMenuItems } from "../api/menuItemApi";
import MenuItemRow from "../components/MenuItemRow";
import { useCart } from "../context/CartContext";

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");
  const [addedItem, setAddedItem] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    setRestaurant(null);
    setError("");

    Promise.all([getById(id), listMenuItems({ restaurant: id })])
      .then(([restaurantResponse, menuResponse]) => {
        setRestaurant(restaurantResponse.data);
        setMenuItems(menuResponse.data || []);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "This restaurant could not be loaded.");
      });
  }, [id]);

  const groupedItems = useMemo(() => menuItems.reduce((groups, item) => {
    const category = item.category || "Menu";
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {}), [menuItems]);

  const handleAddToCart = (item) => {
    addToCart({ ...item, menuItemId: item._id, restaurantId: id });
    setAddedItem(`${item.name} added to your cart.`);
  };

  if (error) {
    return <section className="page-section"><p className="error-message">{error}</p><Link to="/">Back home</Link></section>;
  }

  if (!restaurant) {
    return <section className="page-section"><div className="loading-state"><span className="spinner" />Loading menu...</div></section>;
  }

  return (
    <section className="page-section">
      <Link className="back-link" to="/">&larr; All restaurants</Link>
      <div className="detail-heading">
        <p className="eyebrow">{restaurant.cuisine || "Restaurant"}</p>
        <h1>{restaurant.name}</h1>
        <p className="muted">{restaurant.description || "A local favorite ready to deliver."}</p>
        <p className="restaurant-meta">★ {Number(restaurant.rating || 0).toFixed(1)} &middot; {restaurant.address || "Delivery available"}</p>
      </div>
      <div className="menu-heading"><h2 className="section-title">Menu</h2>{addedItem && <p className="success-message">{addedItem}</p>}</div>
      {Object.entries(groupedItems).map(([category, items]) => (
        <section className="menu-category" key={category}>
          <h3>{category}</h3>
          <div className="menu-list">{items.map((item) => <MenuItemRow key={item._id} item={item} onAddToCart={handleAddToCart} />)}</div>
        </section>
      ))}
      {menuItems.length === 0 && <p className="muted">No menu items are available yet.</p>}
    </section>
  );
}

export default RestaurantDetail;
