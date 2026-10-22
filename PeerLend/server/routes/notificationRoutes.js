import { Router } from 'express'
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/', getNotifications)
router.put('/:notificationId/read', markNotificationRead)

export default router
