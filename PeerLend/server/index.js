import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'node:http'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import loanRoutes from './routes/loanRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import { configureSockets } from './sockets/index.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const port = Number(process.env.PORT) || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    success: true,
    message: 'PeerLend API is running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/loans', loanRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/transactions', transactionRoutes)

const io = configureSockets(httpServer, process.env.CLIENT_URL || 'http://localhost:5173')
app.set('io', io)

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: 'Route not found.',
  })
})

app.use((error, _request, response, _next) => {
  console.error(`API request failed: ${error.message}`)

  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({
      success: false,
      message: 'Request body must contain valid JSON.',
    })
  }

  if (error.name === 'ValidationError') {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [field, detail.message]),
    )

    return response.status(400).json({
      success: false,
      message: 'Please correct the submitted details.',
      errors,
    })
  }

  return response.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  })
})

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured. Add a secret to server/.env.')
    }

    await connectDB()
    httpServer.listen(port, () => {
      console.log(`PeerLend API listening on http://localhost:${port}`)
    })
  } catch (error) {
    console.error(`PeerLend API startup failed: ${error.message}`)
    console.error('PeerLend API startup aborted.')
    process.exitCode = 1
  }
}

startServer()
