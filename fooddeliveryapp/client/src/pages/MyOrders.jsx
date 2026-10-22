import { formatINR } from "../utils/currency";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";
import toast from "react-hot-toast";

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.successMessage) toast.success(location.state.successMessage);
  }, [location.state]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getMyOrders({ page, limit: 10 })
      .then((response) => {
        if (!active) return;
        setOrders(response.data || []);
        setTotalPages(response.totalPages || 1);
      })
      .catch((requestError) => {
        if (active) toast.error(requestError.response?.data?.message || "Your orders could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [page]);

  const sortedOrders = useMemo(() => [...orders].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  ), [orders]);

  return (
    <section className="page-section">
      <p className="eyebrow">Your account</p>
      <h1>My Orders</h1>
      {loading && <div className="loading-state"><span className="spinner" />Loading your orders...</div>}
      {!loading && sortedOrders.length === 0 && (
        <div className="orders-empty">
          <h2>You haven&apos;t placed any orders yet</h2>
          <p className="muted">Find something delicious and your orders will appear here.</p>
          <Link className="primary-link" to="/">Browse restaurants</Link>
        </div>
      )}
      {!loading && sortedOrders.length > 0 && (
        <>
          <div className="order-list detailed-order-list">
            {sortedOrders.map((order) => <OrderCard key={order._id} order={order} />)}
          </div>
          <div className="pagination" aria-label="Order pagination">
            <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}

function OrderCard({ order }) {
  const status = order.status || "pending";
  return (
    <article className="order-card detailed-order-card">
      <div className="order-card-heading">
        <div><h2>{order.restaurant?.name || "Restaurant"}</h2><time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></div>
        <span className={`status status-${status}`}>{statusLabels[status] || status.replaceAll("_", " ")}</span>
      </div>
      <div className="order-items">
        {(order.items || []).map((item, index) => (
          <div className="order-item" key={`${order._id}-${item.menuItem?._id || index}`}>
            <span>{item.menuItem?.name || "Menu item"}</span>
            <span>{item.quantity} &times; {formatINR(item.price)}</span>
          </div>
        ))}
      </div>
      {order.deliveryAddress && (
        <p className="order-delivery-address"><strong>Delivering to:</strong> {order.deliveryAddress}</p>
      )}
      <div className="order-total"><span>Total</span><strong>{formatINR(order.totalAmount)}</strong></div>
    </article>
  );
}

function formatOrderDate(date) {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default MyOrders;
