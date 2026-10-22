import jwt from 'jsonwebtoken'
import User from '../models/User.js'

async function authMiddleware(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({
      success: false,
      message: 'Authentication is required.',
    })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return next(new Error('JWT_SECRET is not configured.'))
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return response.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    })
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    return response.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    })
  }

  try {
    const user = await User.findById(payload.sub)
    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'The account for this token no longer exists.',
      })
    }

    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}

export default authMiddleware
