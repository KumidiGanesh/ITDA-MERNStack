const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/appError");

const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateOrder = (query) =>
  query.populate([
    { path: "restaurant", select: "name" },
    { path: "items.menuItem", select: "name description price" },
  ]);

const handleError = (res, error, message) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message,
  });
};

const placeOrder = async (req, res, next) => {
  try {
    const { restaurantId, items } = req.body;
    const errors = {};

    if (!restaurantId || !isValidId(restaurantId)) errors.restaurantId = "A valid restaurantId is required";
    if (!Array.isArray(items) || items.length === 0) errors.items = "Order must contain at least one item";
    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        if (!item || !isValidId(item.menuItemId)) errors[`items.${index}.menuItemId`] = "A valid menuItemId is required";
        if (!item || !Number.isInteger(item.quantity) || item.quantity <= 0) errors[`items.${index}.quantity`] = "Quantity must be a positive integer";
      });
    }
    if (Object.keys(errors).length) return next(new AppError("Validation failed", 400, errors));

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurant: restaurantId,
    });
    const menuItemsById = new Map(
      menuItems.map((menuItem) => [String(menuItem._id), menuItem]),
    );

    if (menuItems.length !== new Set(menuItemIds.map(String)).size) {
      return res.status(400).json({
        success: false,
        message: "One or more menu items do not exist for this restaurant",
      });
    }

    const orderItems = items.map(({ menuItemId, quantity }) => {
      const menuItem = menuItemsById.get(String(menuItemId));

      if (!menuItem) {
        throw new Error("One or more menu items do not exist for this restaurant");
      }

      return {
        menuItem: menuItem._id,
        quantity,
        price: menuItem.price,
      };
    });
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    await populateOrder(order);

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error.message === "One or more menu items do not exist for this restaurant") {
      return next(new AppError(error.message, 400));
    }
    return next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 10, 1);
    const filter = { user: req.user._id };
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      populateOrder(
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ),
      Order.countDocuments(filter),
    ]);

    return res.json({
      data,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) { return next(error); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const { status } = req.body;

    if (!orderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${orderStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const isAuthorized =
      req.user.role === "admin" ||
      String(restaurant.owner) === String(req.user._id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order",
      });
    }

    order.status = status;
    await order.save();
    await populateOrder(order);

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) { return next(error); }
};

module.exports = {
  placeOrder,
  getMyOrders,
  updateOrderStatus,
};
