const express = require("express");
const {
  createRestaurant,
  getRestaurants,
  searchRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRestaurant);
router.get("/", getRestaurants);
router.get("/search", searchRestaurants);
router.get("/:id", getRestaurantById);
router.put("/:id", protect, updateRestaurant);
router.delete("/:id", protect, deleteRestaurant);

module.exports = router;
