const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/appError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isManager = (restaurant, user) =>
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

const createRestaurant = async (req, res, next) => {
  try {
    const errors = {};
    if (!req.body.name || typeof req.body.name !== "string" || !req.body.name.trim()) errors.name = "Name is required";
    if (req.body.rating !== undefined && (typeof req.body.rating !== "number" || req.body.rating < 0 || req.body.rating > 5)) errors.rating = "Rating must be a number between 0 and 5";
    if (Object.keys(errors).length) return next(new AppError("Validation failed", 400, errors));
    const restaurant = await Restaurant.create({
      ...req.body,
      owner: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: restaurant,
    });
  } catch (error) { return next(error); }
};

const getRestaurants = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      Restaurant.find().skip(skip).limit(limit),
      Restaurant.countDocuments(),
    ]);

    return res.json({
      data,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) { return next(error); }
};

const searchRestaurants = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query q is required",
      });
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {
      $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { cuisine: { $regex: escapedQuery, $options: "i" } },
        { address: { $regex: escapedQuery, $options: "i" } },
      ],
    };

    const [data, totalCount] = await Promise.all([
      Restaurant.find(filter).skip(skip).limit(limit),
      Restaurant.countDocuments(filter),
    ]);

    return res.json({
      data,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) { return next(error); }
};

const getRestaurantById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) { return next(error); }
};

const updateRestaurant = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (!isManager(restaurant, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this restaurant",
      });
    }

    const allowedFields = ["name", "description", "cuisine", "address", "rating"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();

    return res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) { return next(error); }
};

const deleteRestaurant = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (!isManager(restaurant, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this restaurant",
      });
    }

    await restaurant.deleteOne();

    return res.json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (error) { return next(error); }
};

module.exports = {
  createRestaurant,
  getRestaurants,
  searchRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
};
