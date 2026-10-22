import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage, notificationApi } from '../services/api.js'
import usePeerLendSocket from '../hooks/usePeerLendSocket.js'
import './NotificationBell.css'

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatTimestamp(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : timestampFormatter.format(date)
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const rootRef = useRef(null)
  const notificationIdsRef = useRef(new Set())
  const unreadIdsRef = useRef(new Set())

  useEffect(() => {
    let active = true

    notificationApi.getAll()
      .then(({ data }) => {
        if (!active) return
        notificationIdsRef.current = new Set(data.data.notifications.map((item) => item._id))
        unreadIdsRef.current = new Set(
          data.data.notifications.filter((item) => !item.isRead).map((item) => item._id),
        )
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'Notifications are temporarily unavailable.',
          ))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  usePeerLendSocket({
    notificationCreated: (notification) => {
      if (!notification?._id) return
      if (notificationIdsRef.current.has(notification._id)) return
      notificationIdsRef.current.add(notification._id)
      if (!notification.isRead) {
        unreadIdsRef.current.add(notification._id)
        setUnreadCount((current) => current + 1)
      }
      setNotifications((current) => [notification, ...current].slice(0, 50))
    },
    notificationRead: ({ notificationId }) => {
      if (!notificationId) return
      const wasUnread = unreadIdsRef.current.delete(notificationId)
      setNotifications((current) => current.map((item) => (
        item._id === notificationId ? { ...item, isRead: true } : item
      )))
      if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1))
    },
  })

  async function markRead(notification) {
    if (notification.isRead) return

    setError('')
    try {
      const { data } = await notificationApi.markRead(notification._id)
      const updated = data.data.notification
      const wasUnread = unreadIdsRef.current.delete(updated._id)
      setNotifications((current) => current.map((item) => (
        item._id === updated._id ? updated : item
      )))
      if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1))
    } catch (requestError) {
      setError(getApiErrorMessage(
        requestError,
        'We couldn’t update this notification. Please try again.',
      ))
    }
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        className="notification-bell-button"
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell-count" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="notification-panel" id="notification-panel" aria-label="Notifications">
          <header className="notification-panel-heading">
            <div>
              <h2>Notifications</h2>
              <span>{unreadCount} unread</span>
            </div>
            <button
              className="notification-panel-close"
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>
          {error && <p className="notification-panel-error" role="alert">{error}</p>}
          {loading ? (
            <div className="notification-panel-empty" role="status">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="notification-panel-empty">You’re all caught up. New activity will show up here.</div>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <button
                    className={`notification-item${notification.isRead ? ' notification-item-read' : ''}`}
                    type="button"
                    onClick={() => markRead(notification)}
                    aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}. Mark as read`}
                  >
                    <span className="notification-item-indicator" aria-hidden="true" />
                    <span className="notification-item-content">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time dateTime={notification.createdAt}>{formatTimestamp(notification.createdAt)}</time>
                    </span>
                    <span className="notification-item-status">
                      {notification.isRead ? 'Read' : 'Unread'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export default NotificationBell
