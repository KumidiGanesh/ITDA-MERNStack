const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/appError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const canManageRestaurant = (restaurant, user) =>
  user.role === "admin" || String(restaurant.owner) === String(user._id);

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

const findOwnedRestaurant = async (restaurantId, user) => {
  if (!isValidId(restaurantId)) {
    return { error: "Restaurant not found", status: 404 };
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return { error: "Restaurant not found", status: 404 };
  }

  if (!canManageRestaurant(restaurant, user)) {
    return { error: "You are not authorized to manage this restaurant", status: 403 };
  }

  return { restaurant };
};

const createMenuItem = async (req, res, next) => {
  try {
    const { restaurant: restaurantId } = req.body;

    const errors = {};
    if (!req.body.name || typeof req.body.name !== "string" || !req.body.name.trim()) errors.name = "Name is required";
    if (typeof req.body.price !== "number" || req.body.price < 0) errors.price = "Price must be a non-negative number";
    if (!restaurantId) errors.restaurant = "Restaurant is required";
    if (Object.keys(errors).length) return next(new AppError("Validation failed", 400, errors));

    const result = await findOwnedRestaurant(restaurantId, req.user);

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
      });
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      restaurant: result.restaurant._id,
    });

    return res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) { return next(error); }
};

const getMenuItems = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 10, 1);
    const filter = {};

    if (req.query.restaurant) {
      if (!isValidId(req.query.restaurant)) {
        return res.status(400).json({
          success: false,
          message: "Invalid restaurant id",
        });
      }

      filter.restaurant = req.query.restaurant;
    }

    const skip = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      MenuItem.find(filter)
        .populate("restaurant", "name")
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(filter),
    ]);

    return res.json({
      data,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) { return next(error); }
};

const getMenuItemById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const menuItem = await MenuItem.findById(req.params.id).populate(
      "restaurant",
      "name",
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) { return next(error); }
};

const updateMenuItem = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const result = await findOwnedRestaurant(menuItem.restaurant, req.user);

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
      });
    }

    const allowedFields = ["name", "description", "price", "category", "available"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        menuItem[field] = req.body[field];
      }
    });

    await menuItem.save();
    await menuItem.populate("restaurant", "name");

    return res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) { return next(error); }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const result = await findOwnedRestaurant(menuItem.restaurant, req.user);

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
      });
    }

    await menuItem.deleteOne();

    return res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) { return next(error); }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};
