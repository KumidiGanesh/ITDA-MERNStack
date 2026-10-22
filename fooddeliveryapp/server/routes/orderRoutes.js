const express = require("express");
const {
  placeOrder,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/mine", protect, getMyOrders);
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
