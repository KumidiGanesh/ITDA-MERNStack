import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useDeliveryAddress } from "../context/DeliveryAddressContext";

function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, setIsOpen } = useCart();
  const { deliveryAddress, deliveryAddresses, saveDeliveryAddress, selectDeliveryAddress } = useDeliveryAddress();
  const navigate = useNavigate();
  const [deliveryArea, setDeliveryArea] = useState("Hyderabad");
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddAddress = (event) => {
    event.preventDefault();
    const normalizedAddress = newAddress.trim();
    if (normalizedAddress.length < 5 || normalizedAddress.length > 250) return;
    saveDeliveryAddress(normalizedAddress);
    setNewAddress("");
    setIsAddingAddress(false);
    setIsLocationMenuOpen(false);
  };

  return (
    <header className="navbar">
      <Link className="logo" to="/">Crave</Link>
      <div className="location-control">
        <button
          className="location-picker"
          type="button"
          aria-expanded={isLocationMenuOpen}
          aria-haspopup="listbox"
          onClick={() => setIsLocationMenuOpen((isOpen) => !isOpen)}
        >
        <span className="location-pin">⌖</span>
          <span><small>Delivering to</small><strong>{deliveryArea} ▾</strong></span>
        </button>
        {isLocationMenuOpen && (
          <div className="location-menu">
            <p className="location-menu-label">Delivery area</p>
            <div role="listbox" aria-label="Choose delivery area">
              {["Hyderabad", "Charminar"].map((area) => (
                <button
                  className="location-option"
                  type="button"
                  role="option"
                  aria-selected={deliveryArea === area}
                  key={area}
                  onClick={() => {
                    setDeliveryArea(area);
                    setIsLocationMenuOpen(false);
                  }}
                >
                  <span className="location-option-pin">⌖</span>
                  <span><strong>{area}</strong><small>Delivery location</small></span>
                  {deliveryArea === area && <span className="location-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="saved-address-list" role="listbox" aria-label="Saved delivery addresses">
              <p className="location-menu-label">Saved addresses</p>
              {deliveryAddresses.map((address) => (
                <button
                  className="location-option saved-address-option"
                  type="button"
                  role="option"
                  aria-selected={deliveryAddress === address}
                  key={address}
                  onClick={() => {
                    selectDeliveryAddress(address);
                    setIsLocationMenuOpen(false);
                  }}
                >
                  <span className="location-option-pin">⌂</span>
                  <span><strong>{address}</strong><small>Delivery address</small></span>
                  {deliveryAddress === address && <span className="location-check">✓</span>}
                </button>
              ))}
            </div>
            {isAddingAddress ? (
              <form className="add-address-form" onSubmit={handleAddAddress}>
                <label htmlFor="new-delivery-address">New delivery address</label>
                <textarea
                  id="new-delivery-address"
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                  placeholder="House / flat, street, area, city"
                  rows={3}
                  minLength={5}
                  maxLength={250}
                  required
                />
                <div>
                  <button className="add-address-save" type="submit" disabled={newAddress.trim().length < 5}>
                    Save address
                  </button>
                  <button
                    className="add-address-cancel"
                    type="button"
                    onClick={() => {
                      setNewAddress("");
                      setIsAddingAddress(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="add-address-trigger" type="button" onClick={() => setIsAddingAddress(true)}>
                <span aria-hidden="true">+</span> Add delivery address
              </button>
            )}
          </div>
        )}
      </div>
      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/">Home</NavLink>
        {user && <NavLink to="/orders">My Orders</NavLink>}
      </nav>
      <button className="cart-button" type="button" onClick={() => setIsOpen(true)} aria-label="Open shopping cart">
        🛒 Cart <span>{itemCount}</span>
      </button>
      <div className="nav-account">
        {user ? (
          <>
            <span className="welcome">Hi, {user.name}</span>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="login-link" to="/login">Login</Link>
            <Link className="login-link" to="/register">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
