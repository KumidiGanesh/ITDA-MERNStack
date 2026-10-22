import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = (item) => {
    const menuItemId = item.menuItemId || item._id;
    const restaurantId = item.restaurantId || item.restaurant?._id || item.restaurant;
    const existingRestaurantId = items[0]?.restaurantId;

    if (existingRestaurantId && String(existingRestaurantId) !== String(restaurantId)) {
      const shouldReplace = window.confirm(
        "Your cart contains items from another restaurant. Clear it and start a new order?",
      );

      if (!shouldReplace) return;
      setItems([]);
    }

    setItems((currentItems) => {
      const sameRestaurantItems = currentItems.filter(
        (cartItem) => String(cartItem.restaurantId) === String(restaurantId),
      );
      const existingItem = sameRestaurantItems.find(
        (cartItem) => String(cartItem.menuItemId) === String(menuItemId),
      );

      if (existingItem) {
        return sameRestaurantItems.map((cartItem) =>
          String(cartItem.menuItemId) === String(menuItemId)
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }

      return [
        ...sameRestaurantItems,
        {
          menuItemId,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity || 1,
          restaurantId,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeFromCart = (menuItemId) => {
    setItems((currentItems) => currentItems.filter((item) => String(item.menuItemId) !== String(menuItemId)));
  };

  const updateQuantity = (menuItemId, quantity) => {
    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setItems((currentItems) => currentItems.map((item) => (
      String(item.menuItemId) === String(menuItemId)
        ? { ...item, quantity: nextQuantity }
        : item
    )));
  };

  const clearCart = () => setItems([]);
  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      itemCount,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
