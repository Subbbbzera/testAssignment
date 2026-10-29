import { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email) {
      newErrors.email = 'Вкажіть email'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Некоректний формат email'
    }

    if (!password) {
      newErrors.password = 'Вкажіть пароль'
    } else if (password.length < 6) {
      newErrors.password = 'Пароль має містити щонайменше 6 символів'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        toast.success(`Вітаємо, ${email}!`)
      } else {
        await register(email, password)
        toast.success('Акаунт успішно зареєстровано!')
      }

      // Скидання та закриття
      setEmail('')
      setPassword('')
      setShowPassword(false)
      setErrors({})
      onClose()
    } catch {
      toast.error('Помилка авторизації')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      {/* Контейнер модального вікна */}
      <div 
        className="relative w-full max-w-[380px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закриття */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Перемикач Вхід / Реєстрація */}
        <div className="flex border-b border-[#2a2a2a] mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setErrors({})
            }}
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 mr-6 cursor-pointer ${
              tab === 'login'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Вхід
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register')
              setErrors({})
            }}
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              tab === 'register'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Реєстрація
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле Email */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] pl-9 pr-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Поле Пароль */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Мінімум 6 символів"
                className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] pl-9 pr-10 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Головна кнопка дії */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-[38px] bg-white text-neutral-900 text-sm font-medium rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Зачекайте...' : tab === 'login' ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
