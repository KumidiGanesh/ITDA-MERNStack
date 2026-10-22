import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\d{10}$/

function validateRegistration(body) {
  const errors = {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : ''
  const profileImage = typeof body.profileImage === 'string' ? body.profileImage.trim() : ''

  if (!name) errors.name = 'Name is required.'
  else if (name.length > 100) errors.name = 'Name cannot exceed 100 characters.'

  if (!email) errors.email = 'Email is required.'
  else if (email.length > 254 || !emailPattern.test(email)) errors.email = 'Enter a valid email address.'

  if (!phone) errors.phone = 'Phone is required.'
  else if (!phonePattern.test(phone)) errors.phone = 'Enter a phone number with exactly 10 digits.'

  if (!password) errors.password = 'Password is required.'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters long.'
  else if (Buffer.byteLength(password, 'utf8') > 72) errors.password = 'Password cannot exceed 72 UTF-8 bytes.'

  if (!confirmPassword) errors.confirmPassword = 'Confirm password is required.'
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  if (!role) errors.role = 'Role is required.'
  else if (!['borrower', 'lender', 'both'].includes(role)) {
    errors.role = 'Role must be borrower, lender, or both.'
  }

  if (body.profileImage !== undefined && typeof body.profileImage !== 'string') {
    errors.profileImage = 'Profile image must be a string.'
  }

  return {
    errors,
    values: { name, email, phone, password, role, profileImage },
  }
}

function issueToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.')
  }

  return jwt.sign({ sub: userId.toString() }, secret, { expiresIn: '7d' })
}

function sendAuthResponse(response, user, message, statusCode) {
  const token = issueToken(user._id)

  return response.status(statusCode).json({
    success: true,
    message,
    data: {
      user: user.toJSON(),
      token,
    },
  })
}

export async function register(request, response, next) {
  try {
    const { errors, values } = validateRegistration(request.body ?? {})

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        success: false,
        message: 'Please correct the registration details.',
        errors,
      })
    }

    const existingUser = await User.findOne({ email: values.email }).select('_id')
    if (existingUser) {
      return response.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email is already registered.' },
      })
    }

    const user = await User.create({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: values.role,
      profileImage: values.profileImage,
    })

    return sendAuthResponse(response, user, 'Registration successful', 201)
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return response.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email is already registered.' },
      })
    }

    return next(error)
  }
}

export async function login(request, response, next) {
  try {
    const email = typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
    const password = typeof request.body?.password === 'string'
      ? request.body.password
      : ''
    const errors = {}

    if (!email) errors.email = 'Email is required.'
    else if (email.length > 254 || !emailPattern.test(email)) errors.email = 'Enter a valid email address.'
    if (!password) errors.password = 'Password is required.'

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        success: false,
        message: 'Email and password are required.',
        errors,
      })
    }

    const user = await User.findOne({ email }).select('+password')
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false

    if (!user || !passwordMatches) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    return sendAuthResponse(response, user, 'Login successful', 200)
  } catch (error) {
    return next(error)
  }
}

export function getCurrentUser(request, response) {
  return response.json({
    success: true,
    message: 'User retrieved successfully',
    data: { user: request.user.toJSON() },
  })
}
