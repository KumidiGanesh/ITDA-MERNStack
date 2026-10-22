import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api.js'
import { disconnectPeerLendSocket } from '../services/loanSocket.js'
import AuthContext from './authContext.js'

const TOKEN_KEY = 'peerlend.token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem(TOKEN_KEY)

    if (!token) {
      return undefined
    }

    authApi.getCurrentUser()
      .then(({ data }) => {
        if (active) setUser(data.data.user)
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details)
    return data
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    const token = data.data?.token

    if (!token) {
      throw new Error('The server did not return a valid sign-in session.')
    }

    sessionStorage.setItem(TOKEN_KEY, token)

    try {
      const currentUserResponse = await authApi.getCurrentUser()
      const currentUser = currentUserResponse.data.data?.user

      if (!currentUser) {
        throw new Error('We could not load your account. Please try signing in again.')
      }

      setUser(currentUser)
      return currentUser
    } catch (error) {
      sessionStorage.removeItem(TOKEN_KEY)
      setUser(null)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    disconnectPeerLendSocket()
    sessionStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, register, login, logout }),
    [user, loading, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
