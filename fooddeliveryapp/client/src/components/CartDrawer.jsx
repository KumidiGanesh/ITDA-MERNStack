import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../api/orderApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useDeliveryAddress } from "../context/DeliveryAddressContext";
import toast from "react-hot-toast";
import { formatINR } from "../utils/currency";

function CartDrawer() {
  const { user } = useAuth();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart, isOpen, setIsOpen } = useCart();
  const { deliveryAddress, saveDeliveryAddress } = useDeliveryAddress();
  const [loading, setLoading] = useState(false);
  const [addressDraft, setAddressDraft] = useState(deliveryAddress);
  const [isAddressPromptOpen, setIsAddressPromptOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setAddressDraft(deliveryAddress);
      setIsAddressPromptOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setAddressDraft(deliveryAddress);
  }, [deliveryAddress]);

  const submitOrder = async (orderAddress) => {
    if (!user) {
      setIsAddressPromptOpen(false);
      navigate("/login", { state: { from: "/orders" } });
      setIsOpen(false);
      return;
    }

    setLoading(true);

    try {
      await placeOrder({
        restaurantId: items[0].restaurantId,
        items: items.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
        deliveryAddress: orderAddress,
      });
      clearCart();
      setIsAddressPromptOpen(false);
      setIsOpen(false);
      toast.success("Your order was placed successfully.");
      navigate("/orders", { state: { successMessage: "Your order was placed successfully." } });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to place your order.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!user) {
      navigate("/login", { state: { from: "/orders" } });
      setIsOpen(false);
      return;
    }

    if (deliveryAddress) {
      submitOrder(deliveryAddress);
      return;
    }

    setAddressDraft("");
    setIsAddressPromptOpen(true);
  };

  const handleAddressSubmit = (event) => {
    event.preventDefault();
    const normalizedAddress = addressDraft.trim();
    if (normalizedAddress.length < 5 || normalizedAddress.length > 250) return;
    saveDeliveryAddress(normalizedAddress);
    submitOrder(normalizedAddress);
  };

  if (!isOpen) return null;

  return (
    <>
      <button className="cart-overlay" type="button" aria-label="Close cart" onClick={() => setIsOpen(false)} />
      <aside className="cart-drawer" aria-label="Shopping cart">
        <div className="cart-drawer-header"><div><p className="eyebrow">Your order</p><h2>Cart</h2></div><button className="drawer-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close cart">&times;</button></div>
        {items.length === 0 ? <p className="muted">Your cart is empty.</p> : <div className="cart-items">
          {items.map((item) => (
            <div className="cart-line" key={item.menuItemId}>
              <div><h3>{item.name}</h3><span>{formatINR(item.price)} each</span></div>
              <div className="cart-line-controls"><button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>-</button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>+</button><button className="remove-item" type="button" onClick={() => removeFromCart(item.menuItemId)}>Remove</button></div>
            </div>
          ))}
        </div>}
        <div className="cart-drawer-footer">
          <div><span>Total</span><strong>{formatINR(totalAmount)}</strong></div>
          <button type="button" onClick={handlePlaceOrder} disabled={!items.length || loading}>
            {loading ? "Placing order..." : "Place Order"}
          </button>
        </div>
      </aside>
      {isAddressPromptOpen && (
        <div className="address-dialog-backdrop">
          <section
            className="address-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-dialog-title"
          >
            <div className="address-dialog-heading">
              <div>
                <p className="eyebrow">Almost there</p>
                <h2 id="address-dialog-title">Enter your delivery address</h2>
              </div>
              <button
                className="drawer-close"
                type="button"
                onClick={() => setIsAddressPromptOpen(false)}
                aria-label="Close address prompt"
              >
                &times;
              </button>
            </div>
            <p className="muted">Add the address where you’d like this order delivered. We’ll save it for next time.</p>
            <form className="address-dialog-form" onSubmit={handleAddressSubmit}>
              <label htmlFor="checkout-delivery-address">Delivery address</label>
              <textarea
                id="checkout-delivery-address"
                value={addressDraft}
                onChange={(event) => setAddressDraft(event.target.value)}
                placeholder="House / flat, street, area, city, and landmark"
                rows={4}
                minLength={5}
                maxLength={250}
                required
              />
              <div className="address-dialog-actions">
                <button
                  className="address-dialog-cancel"
                  type="button"
                  onClick={() => setIsAddressPromptOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={loading || addressDraft.trim().length < 5}
                >
                  {loading ? "Placing order..." : "Confirm address & place order"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default CartDrawer;
