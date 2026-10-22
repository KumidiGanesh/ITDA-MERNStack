import Notification from '../models/Notification.js'

export async function getNotifications(request, response, next) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: request.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({ user: request.user._id, isRead: false }),
    ])

    return response.json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: { notifications, unreadCount },
    })
  } catch (error) {
    return next(error)
  }
}

export async function markNotificationRead(request, response, next) {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(request.params.notificationId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid notification ID.',
      })
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: request.params.notificationId, user: request.user._id },
      { isRead: true },
      { returnDocument: 'after' },
    ).lean()

    if (!notification) {
      return response.status(404).json({
        success: false,
        message: 'Notification not found.',
      })
    }

    request.app.get('io')?.to(`user:${request.user._id}`).emit('notificationRead', {
      notificationId: notification._id.toString(),
    })

    return response.json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification },
    })
  } catch (error) {
    return next(error)
  }
}
