import { formatINR } from "../utils/currency";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    getMyOrders()
      .then((response) => setOrders(response.data || []))
      .catch(() => setError("Your orders could not be loaded."));
  }, []);

  return (
    <section className="page-section">
      <p className="eyebrow">Your account</p><h1>My Orders</h1>
      {location.state?.successMessage && <p className="success-message">{location.state.successMessage}</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order._id}>
            <div><h2>{order.restaurant?.name || "Restaurant"}</h2><p>{order.items?.length || 0} items</p></div>
            <div className="order-meta"><span className={`status status-${order.status}`}>{order.status.replaceAll("_", " ")}</span><strong>{formatINR(order.totalAmount)}</strong></div>
          </article>
        ))}
        {!error && orders.length === 0 && <p className="muted">You have not placed any orders yet.</p>}
      </div>
    </section>
  );
}

export default OrdersPage;
