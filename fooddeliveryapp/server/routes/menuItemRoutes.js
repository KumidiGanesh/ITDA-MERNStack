const express = require("express");
const {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuItemController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createMenuItem);
router.get("/", getMenuItems);
router.get("/:id", getMenuItemById);
router.put("/:id", protect, updateMenuItem);
router.delete("/:id", protect, deleteMenuItem);

module.exports = router;
