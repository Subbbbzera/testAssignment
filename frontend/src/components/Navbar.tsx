import { LogOut, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  activeTab: string
  onSelectTab: (tab: string) => void
  onOpenAuth: () => void
}

export default function Navbar({ activeTab, onSelectTab, onOpenAuth }: NavbarProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  return (
    <header className="px-5 sm:px-6 py-3.5 border-b border-[#2a2a2a] flex items-center gap-5">
      {/* Ліворуч: Текстовий логотип без іконки */}
      <div 
        onClick={() => onSelectTab('rooms')} 
        className="flex items-center text-white font-bold text-base tracking-tight shrink-0 cursor-pointer"
      >
        <span>Бронювання</span>
      </div>

      {/* Пункти меню залежно від ролі */}
      <nav className="flex items-center gap-4 text-sm font-medium overflow-x-auto no-scrollbar">
        {/* Кімнати доступні всім */}
        <button
          onClick={() => onSelectTab('rooms')}
          className={`transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rooms' ? 'text-sky-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Кімнати
        </button>

        {/* Пункти для авторизованого користувача */}
        {isAuthenticated && (
          <button
            onClick={() => onSelectTab('my-bookings')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'my-bookings' ? 'text-sky-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Мої броні
          </button>
        )}

        {/* Додаткові пункти лише для admin */}
        {isAuthenticated && isAdmin && (
          <>
            <button
              onClick={() => onSelectTab('admin-rooms')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'admin-rooms' ? 'text-sky-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Керування кімнатами
            </button>
            <button
              onClick={() => onSelectTab('admin-bookings')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'admin-bookings' ? 'text-sky-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Усі броні
            </button>
          </>
        )}
      </nav>

      {/* Праворуч: Стан входу (Кнопка Увійти або Email + Вийти) */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {!isAuthenticated ? (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 text-xs text-neutral-200 bg-transparent border border-neutral-700 rounded-[8px] hover:border-neutral-400 hover:bg-neutral-800/60 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Увійти</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-neutral-400 hidden sm:inline">
                {user?.email}
              </span>
              {isAdmin && (
                <span className="text-[11px] font-medium text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded">
                  admin
                </span>
              )}
            </div>

            <button
              onClick={async () => {
                await logout()
                toast.success('Сесію завершено')
              }}
              className="px-3 py-1.5 text-xs text-neutral-300 bg-transparent border border-neutral-700 rounded-[8px] hover:border-neutral-500 hover:bg-neutral-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Вийти</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
