const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const MenuItem = require("./models/MenuItem");

dotenv.config();

const demoRestaurants = [
  {
    name: "Saffron Street",
    description: "Bright Indian comfort food with fragrant spices and generous portions.",
    cuisine: "Indian",
    address: "12 Market Lane",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Butter Chicken Bowl", description: "Creamy tomato curry, basmati rice, and naan.", category: "Popular", price: 299, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80" },
      { name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken, herbs, and saffron.", category: "Rice Specials", price: 329, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80" },
      { name: "Paneer Tikka Wrap", description: "Charred paneer, peppers, mint chutney, and salad.", category: "Wraps", price: 249, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80" },
      { name: "Mango Lassi", description: "Cool, creamy mango yogurt drink.", category: "Drinks", price: 129, image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "La Luna Pizza",
    description: "Hand-stretched pizzas, bubbling cheese, and classic Italian flavors.",
    cuisine: "Pizza",
    address: "84 Oak Avenue",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Margherita Pizza", description: "Tomato, fresh mozzarella, basil, and olive oil.", category: "Pizzas", price: 399, image: "https://images.unsplash.com/photo-1548365328-9f547fb9587c?auto=format&fit=crop&w=900&q=80" },
      { name: "Pepperoni Feast", description: "Crispy pepperoni, mozzarella, and house tomato sauce.", category: "Pizzas", price: 499, image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=900&q=80" },
      { name: "Garlic Knots", description: "Warm knots tossed in garlic butter and herbs.", category: "Sides", price: 199, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Bowl & Bloom",
    description: "Colorful, nourishing bowls made with fresh seasonal ingredients.",
    cuisine: "Healthy",
    address: "5 Riverside Walk",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Green Goddess Bowl", description: "Avocado, quinoa, greens, chickpeas, and herb dressing.", category: "Bowls", price: 349, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80" },
      { name: "Teriyaki Salmon", description: "Roasted salmon, brown rice, edamame, and sesame.", category: "Bowls", price: 599, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80" },
      { name: "Berry Chia Cup", description: "Chia pudding, berries, granola, and honey.", category: "Desserts", price: 229, image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Wok This Way",
    description: "Fast, sizzling Asian favorites with bold sauces and crunchy toppings.",
    cuisine: "Chinese",
    address: "21 Garden Square",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Crispy Chili Noodles", description: "Wok-tossed noodles, vegetables, chili oil, and peanuts.", category: "Noodles", price: 279, image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80" },
      { name: "Sweet & Sour Chicken", description: "Crispy chicken, peppers, pineapple, and jasmine rice.", category: "Mains", price: 329, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80" },
      { name: "Vegetable Dumplings", description: "Steamed dumplings served with soy ginger dip.", category: "Starters", price: 199, image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Hyderabad Spice House",
    description: "Authentic Hyderabadi biryani, kebabs, and rich regional flavors.",
    cuisine: "Hyderabadi",
    address: "42 Charminar Road",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Araku Valley Dum Biryani", description: "Slow-cooked biryani with aromatic rice, tender chicken, saffron, and mint.", category: "Biryani", price: 429, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80" },
      { name: "Chicken Biryani", description: "Dum-cooked basmati rice, tender chicken, saffron, and fried onions.", category: "Biryani", price: 299, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80" },
      { name: "Mutton Biryani", description: "Slow-cooked mutton layered with fragrant Hyderabadi rice.", category: "Biryani", price: 399, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80" },
      { name: "Chicken 65", description: "Crispy spicy chicken bites with curry leaves and lemon.", category: "Starters", price: 249, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80" },
      { name: "Double Ka Meetha", description: "Golden bread pudding with cardamom, milk, and nuts.", category: "Desserts", price: 149, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Anapurna",
    description: "Classic Andhra and biryani favorites with rich spice and homestyle flavor.",
    cuisine: "Andhra",
    address: "19 Varun Avenue",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Chicken Dum Biryani", description: "Aromatic dum biryani with tender chicken, basmati rice, and spices.", category: "Biryani", price: 180, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80" },
      { name: "Egg Biryani", description: "Fragrant rice layered with spiced eggs and fresh herbs.", category: "Biryani", price: 150, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80" },
      { name: "Andhra Chicken Curry", description: "Fiery curry with rich masala and warm spices.", category: "Curries", price: 220, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Ganesh Family Kitchen",
    description: "Homestyle Indian meals, biryani, and fresh snacks prepared with traditional spices.",
    cuisine: "Indian",
    address: "7 Main Road",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80",
    menu: [
      { name: "Special Chicken Biryani", description: "Fragrant basmati rice with tender chicken, herbs, and fried onions.", category: "Biryani", price: 249, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80" },
      { name: "Paneer Butter Masala", description: "Soft paneer in a creamy tomato gravy with Indian spices.", category: "Curries", price: 199, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80" },
      { name: "Veg Fried Rice", description: "Wok-tossed rice with fresh vegetables and aromatic seasoning.", category: "Rice Specials", price: 149, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Araku Tribal Kitchen",
    description: "Authentic Araku Valley flavors inspired by traditional tribal cooking.",
    cuisine: "Araku Special",
    address: "Araku Valley Main Road",
    rating: 4.9,
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Pitang_Oying_-_Mising_Kitchen_Resturant%2C_Guwahati%2C_Assam%2C_1618420295814._jpg.jpg/960px-Pitang_Oying_-_Mising_Kitchen_Resturant%2C_Guwahati%2C_Assam%2C_1618420295814._jpg.jpg",
    menu: [
      { name: "Araku Valley Special Bamboo Chicken Biryani", description: "Aromatic chicken biryani prepared with traditional bamboo cooking style and local spices.", category: "Araku Specials", price: 300, image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/BambooChicken.jpg/960px-BambooChicken.jpg" },
      { name: "Araku Special Coffee", description: "Freshly brewed aromatic coffee inspired by the famous Araku Valley coffee plantations.", category: "Beverages", price: 99, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80" },
      { name: "Ragi Sangati", description: "Traditional Andhra-style ragi millet balls served with a flavorful village curry.", category: "Araku Specials", price: 179, image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Ragi_Mudde_with_veg_sambhar.jpg/960px-Ragi_Mudde_with_veg_sambhar.jpg" },
      { name: "Tribal Chicken Roast", description: "Tender chicken roasted with fragrant herbs and traditional spices.", category: "Tribal Specials", price: 329, image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Rosemary_Roast_Chicken.jpg/960px-Rosemary_Roast_Chicken.jpg" },
    ],
  },
];

const seed = async () => {
  await connectDB();

  const ownerPassword = await bcrypt.hash("DemoPassword123!", 12);
  const adminPassword = await bcrypt.hash("GANESH@1432", 12);

  const owner = await User.findOneAndUpdate(
    { email: "demo@crave.test" },
    { name: "Crave Demo Owner", email: "demo@crave.test", password: ownerPassword, role: "owner" },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await User.findOneAndUpdate(
    { email: "kumidiganesh615@gmail.com" },
    { name: "Ganesh Kumar", email: "kumidiganesh615@gmail.com", password: adminPassword, role: "admin" },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  for (const restaurantData of demoRestaurants) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { name: restaurantData.name },
      { ...restaurantData, menu: undefined, owner: owner._id },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    for (const item of restaurantData.menu) {
      await MenuItem.findOneAndUpdate(
        { restaurant: restaurant._id, name: item.name },
        { ...item, restaurant: restaurant._id, available: true },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }
  }

  console.log(`Seeded ${demoRestaurants.length} restaurants with menu items.`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
