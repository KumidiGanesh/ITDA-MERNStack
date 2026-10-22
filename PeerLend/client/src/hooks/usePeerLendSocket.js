import { useEffect, useRef, useState } from 'react'
import { subscribeToPeerLendEvents } from '../services/loanSocket.js'

function usePeerLendSocket(handlers) {
  const handlersRef = useRef(handlers)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const eventNames = Object.keys(handlers).sort()
  const eventKey = eventNames.join('|')

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const activeEventNames = eventKey ? eventKey.split('|') : []
    const eventHandlers = Object.fromEntries(
      activeEventNames.map((event) => [
        event,
        (...args) => handlersRef.current[event]?.(...args),
      ]),
    )

    return subscribeToPeerLendEvents(eventHandlers, {
      onConnect: () => {
        setConnected(true)
        setConnectionError('')
      },
      onDisconnect: () => setConnected(false),
      onError: (error) => {
        setConnected(false)
        setConnectionError(error.message || 'Live updates are temporarily unavailable.')
      },
    })
  }, [eventKey])

  return { connected, connectionError }
}

export default usePeerLendSocket
