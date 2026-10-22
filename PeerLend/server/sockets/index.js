import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import User from '../models/User.js'

export function configureSockets(httpServer, origin) {
  const io = new Server(httpServer, {
    cors: { origin },
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string' || !token) {
      next(new Error('Authentication required.'))
      return
    }

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      next(new Error('Invalid authentication token.'))
      return
    }

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      next(new Error('Invalid authentication token.'))
      return
    }

    try {
      const user = await User.findById(payload.sub).select('_id role')
      if (!user) {
        next(new Error('Authenticated user not found.'))
        return
      }

      socket.data.user = {
        id: user._id.toString(),
        role: user.role,
      }
      next()
    } catch (error) {
      console.error(`Could not authenticate Socket.IO connection: ${error.message}`)
      next(new Error('Socket authentication is temporarily unavailable.'))
    }
  })

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user
    socket.join(`user:${id}`)

    if (role === 'lender' || role === 'both') {
      socket.join('role:lender')
    }
    if (role === 'borrower' || role === 'both') {
      socket.join('role:borrower')
    }

    console.info(`Authenticated Socket.IO connection for user ${id}.`)
  })

  return io
}
