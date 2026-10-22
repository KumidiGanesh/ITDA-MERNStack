import { Router } from 'express'
import { getTransactions } from '../controllers/transactionController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', authMiddleware, getTransactions)

export default router
