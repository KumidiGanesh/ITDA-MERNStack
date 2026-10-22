import { formatINR } from "../utils/currency";

function MenuItemRow({ item, onAddToCart = () => {} }) {
  return (
    <article className={`menu-item ${item.available === false ? "menu-item-unavailable" : ""}`}>
      {item.image ? <img className="menu-item-image" src={item.image} alt={item.name} /> : null}
      <div className="menu-item-copy">
        <h3>{item.name}</h3>
        <p>{item.description || "Freshly prepared for you."}</p>
        <span className="availability">{item.available === false ? "Currently unavailable" : "Available"}</span>
      </div>
      <div className="menu-item-action">
        <strong>{formatINR(item.price)}</strong>
        <button type="button" disabled={item.available === false} onClick={() => onAddToCart(item)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}

export default MenuItemRow;
