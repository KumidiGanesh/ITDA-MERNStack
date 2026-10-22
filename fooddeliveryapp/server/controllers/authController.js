const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const errors = {};
    if (!name || typeof name !== "string" || !name.trim()) errors.name = "Name is required";
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "A valid email is required";
    if (!password || typeof password !== "string" || password.length < 6) errors.password = "Password must be at least 6 characters";
    if (Object.keys(errors).length) {
      return next(new AppError("Validation failed", 400, errors));
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      token: createToken(user._id),
      user: userResponse(user),
    });
  } catch (error) { return next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const errors = {};
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) errors.email = "A valid email is required";
    if (!password) errors.password = "Password is required";
    if (Object.keys(errors).length) {
      return next(new AppError("Validation failed", 400, errors));
    }

    const user = await User.findOne({ email: normalizedEmail });
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      token: createToken(user._id),
      user: userResponse(user),
    });
  } catch (error) { return next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) { return next(error); }
};

module.exports = { register, login, getMe };
