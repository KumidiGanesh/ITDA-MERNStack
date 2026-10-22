import { io } from 'socket.io-client'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const socketOrigin = new URL(apiUrl, window.location.origin).origin
const TOKEN_KEY = 'peerlend.token'

let socket
let socketToken

function getSocket(token) {
  if (socket && socketToken !== token) {
    socket.disconnect()
    socket = undefined
  }

  if (!socket) {
    socketToken = token
    socket = io(socketOrigin, {
      autoConnect: false,
      auth: { token },
      transports: ['websocket', 'polling'],
    })
  }

  return socket
}

export function subscribeToPeerLendEvents(handlers, statusHandlers = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (!token) {
    statusHandlers.onDisconnect?.('Authentication required for live updates.')
    return () => {}
  }

  const currentSocket = getSocket(token)
  const onConnect = () => statusHandlers.onConnect?.()
  const onDisconnect = (reason) => statusHandlers.onDisconnect?.(reason)
  const onConnectError = (error) => statusHandlers.onError?.(error)

  for (const [event, handler] of Object.entries(handlers)) {
    currentSocket.on(event, handler)
  }
  currentSocket.on('connect', onConnect)
  currentSocket.on('disconnect', onDisconnect)
  currentSocket.on('connect_error', onConnectError)

  if (!currentSocket.connected) currentSocket.connect()

  return () => {
    for (const [event, handler] of Object.entries(handlers)) {
      currentSocket.off(event, handler)
    }
    currentSocket.off('connect', onConnect)
    currentSocket.off('disconnect', onDisconnect)
    currentSocket.off('connect_error', onConnectError)
  }
}

export function disconnectPeerLendSocket() {
  socket?.disconnect()
  socket = undefined
  socketToken = undefined
}
