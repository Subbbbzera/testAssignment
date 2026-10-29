import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { apiClient } from '../api/client'
import { getCookie, setCookie, removeCookie } from '../utils/cookies'
import type { User, Role } from '../types'

interface JwtPayload {
  sub: string
  email: string
  role: Role
  exp?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password?: string) => Promise<void>
  register: (email: string, password?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const COOKIE_NAME = 'access_token'
const USER_KEY = 'booking_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Відновлення сесії з cookies або localStorage при старті
  useEffect(() => {
    const savedToken = getCookie(COOKIE_NAME) || localStorage.getItem('booking_access_token')
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(savedToken)
        setUser({
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        })
        setToken(savedToken)
        return
      } catch {
        // Якщо токен недійсний
      }
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }

    // Слухаємо подію автоматичного розлогіну на 401
    const handleLogoutEvent = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:logout', handleLogoutEvent)
    return () => window.removeEventListener('auth:logout', handleLogoutEvent)
  }, [])

  // Вхід: надсилає запит на бекенд, зберігає токен у Cookies
  const login = async (email: string, password = 'password123') => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { access_token, user: apiUser } = response.data

    setCookie(COOKIE_NAME, access_token, 7)
    localStorage.setItem('booking_access_token', access_token)

    let currentUser: User
    try {
      const decoded = jwtDecode<JwtPayload>(access_token)
      currentUser = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      }
    } catch {
      currentUser = apiUser || {
        id: String(Date.now()),
        email,
        role: 'user',
      }
    }

    setUser(currentUser)
    setToken(access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
  }

  // Реєстрація: POST /auth/register
  // ВАЖЛИВО: не придушуємо помилки (наприклад 409 Conflict), а викидаємо їх далі для зупинки форми!
  const register = async (email: string, password = 'password123') => {
    await apiClient.post('/auth/register', { email, password })
    // Автоматично логінимо лише у разі успішної реєстрації
    await login(email, password)
  }

  // Вихід: видаляє Cookie та чистить стан
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ігноруємо помилки мережі при виході
    }

    removeCookie(COOKIE_NAME)
    localStorage.removeItem('booking_access_token')
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
