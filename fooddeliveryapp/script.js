const restaurants = [
  { id: 1, name: "Mia's Pizzeria", description: "Neapolitan pizza", category: "pizza", icon: "🍕", rating: "4.9", time: "20-30 min", price: 14.5 },
  { id: 2, name: "The Good Burger", description: "Smash burgers", category: "burgers", icon: "🍔", rating: "4.8", time: "25-35 min", price: 12 },
  { id: 3, name: "Kumo Kitchen", description: "Japanese comfort food", category: "asian", icon: "🍜", rating: "4.7", time: "30-40 min", price: 16 },
  { id: 4, name: "Green Table", description: "Fresh & nourishing", category: "healthy", icon: "🥗", rating: "4.9", time: "15-25 min", price: 13.5 },
  { id: 5, name: "Sugar & Slice", description: "Homemade desserts", category: "desserts", icon: "🍰", rating: "4.8", time: "20-30 min", price: 8.5 },
  { id: 6, name: "Basil & Bowl", description: "Thai street food", category: "asian", icon: "🍲", rating: "4.6", time: "25-35 min", price: 15 }
];

const cart = new Map();
const restaurantGrid = document.querySelector("#restaurantGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const cartDrawer = document.querySelector("#cartDrawer");
const overlay = document.querySelector("#overlay");

function renderRestaurants(items = restaurants) {
  restaurantGrid.innerHTML = items.map((restaurant) => `
    <article class="restaurant-card">
      <div class="card-image ${restaurant.category}" data-icon="${restaurant.icon}">
        <span class="rating">★ ${restaurant.rating}</span><span class="time">${restaurant.time}</span>
      </div>
      <div class="card-copy"><h3>${restaurant.name}</h3><p>${restaurant.description}</p><div class="card-bottom"><span class="price">$${restaurant.price.toFixed(2)}</span><button class="add-button" data-add="${restaurant.id}" aria-label="Add ${restaurant.name} to cart">+</button></div></div>
    </article>
  `).join("");
  emptyState.hidden = items.length > 0;
}

function filteredRestaurants(category = "all") {
  const query = searchInput.value.trim().toLowerCase();
  return restaurants.filter((restaurant) => {
    const matchesCategory = category === "all" || restaurant.category === category;
    const matchesQuery = !query || `${restaurant.name} ${restaurant.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function updateRestaurantView(category) {
  document.querySelectorAll(".category").forEach((button) => button.classList.toggle("active", button.dataset.category === category));
  renderRestaurants(filteredRestaurants(category));
}

document.querySelectorAll(".category").forEach((button) => button.addEventListener("click", () => updateRestaurantView(button.dataset.category)));
searchInput.addEventListener("input", () => updateRestaurantView(document.querySelector(".category.active").dataset.category));
document.querySelector("#searchButton").addEventListener("click", () => searchInput.focus());
document.querySelector("#searchSubmit").addEventListener("click", () => document.querySelector("#restaurants").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#showAllButton").addEventListener("click", () => { searchInput.value = ""; updateRestaurantView("all"); });

function renderCart() {
  const items = [...cart.entries()].map(([id, quantity]) => ({ ...restaurants.find((restaurant) => restaurant.id === id), quantity }));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.querySelector("#cartCount").textContent = totalItems;
  document.querySelector("#cartTotal").textContent = `$${total.toFixed(2)}`;
  document.querySelector("#checkoutButton").disabled = items.length === 0;
  document.querySelector("#cartItems").innerHTML = items.length ? items.map((item) => `
    <div class="cart-item"><span class="cart-item-icon">${item.icon}</span><div class="cart-item-info"><strong>${item.name}</strong><span>$${item.price.toFixed(2)} each</span></div><div class="quantity"><button data-decrease="${item.id}" aria-label="Decrease quantity">-</button><span>${item.quantity}</span><button data-increase="${item.id}" aria-label="Increase quantity">+</button></div></div>
  `).join("") : '<p class="cart-empty">Your cart is waiting for something delicious.</p>';
}

function setCartOpen(isOpen) { cartDrawer.classList.toggle("open", isOpen); overlay.classList.toggle("open", isOpen); cartDrawer.setAttribute("aria-hidden", String(!isOpen)); }
document.querySelector("#restaurantGrid").addEventListener("click", (event) => { const button = event.target.closest("[data-add]"); if (!button) return; const id = Number(button.dataset.add); cart.set(id, (cart.get(id) || 0) + 1); renderCart(); setCartOpen(true); });
document.querySelector("#cartItems").addEventListener("click", (event) => { const button = event.target.closest("button"); if (!button) return; const id = Number(button.dataset.increase || button.dataset.decrease); const next = (cart.get(id) || 0) + (button.dataset.increase ? 1 : -1); if (next > 0) cart.set(id, next); else cart.delete(id); renderCart(); });
document.querySelector("#cartButton").addEventListener("click", () => setCartOpen(true));
document.querySelector("#closeCart").addEventListener("click", () => setCartOpen(false));
overlay.addEventListener("click", () => setCartOpen(false));
document.querySelector("#checkoutButton").addEventListener("click", () => { alert("Thanks! Checkout is ready to connect to your payment provider."); });

renderRestaurants();
renderCart();
