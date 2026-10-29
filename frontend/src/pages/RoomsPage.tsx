import { useState, useEffect } from 'react'
import { Users, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../api/client'
import type { Room } from '../types'

export default function RoomsPage() {
  const { isAuthenticated, user, isAdmin } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('rooms')

  // Форма дат пошуку
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Стан пошуку
  const [searchState, setSearchState] = useState<'initial' | 'loading' | 'success' | 'empty'>('initial')
  const [rooms, setRooms] = useState<Room[]>([])

  // Стан адмін-панелі створення кімнат
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState('')
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // Завантажуємо список усіх кімнат для адміна з реального API
  useEffect(() => {
    if (activeTab === 'admin-rooms' && isAdmin) {
      apiClient
        .get('/rooms')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setAllRooms(res.data)
          }
        })
        .catch(() => {
          toast.error('Не вдалося завантажити список кімнат')
        })
    }
  }, [activeTab, isAdmin])

  // Обробник створення нової кімнати (Admin)
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRoomName.trim()) {
      toast.error('Вкажіть назву кімнати')
      return
    }

    const capacityNum = Number(newRoomCapacity)
    if (!capacityNum || capacityNum < 1) {
      toast.error('Місткість має бути цілим числом більше 0')
      return
    }

    setIsCreatingRoom(true)
    try {
      const res = await apiClient.post('/rooms', {
        name: newRoomName.trim(),
        capacity: capacityNum,
      })
      const created = res.data
      setAllRooms((prev) => [...prev, created])
      toast.success(`Кімнату «${created.name}» успішно створено!`)
      setNewRoomName('')
      setNewRoomCapacity('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Помилка при створенні кімнати')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  // Обробник пошуку кімнат
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!startTime || !endTime) {
      toast.error('Будь ласка, вкажіть початок та кінець бронювання')
      return
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    if (startDate >= endDate) {
      toast.error('Час початку має бути раніше за час завершення')
      return
    }

    if (startDate < new Date()) {
      toast.error('Початок бронювання не може бути в минулому')
      return
    }

    setSearchState('loading')

    // Запит до реального API GET /rooms/available?start_time=...&end_time=...
    apiClient
      .get('/rooms/available', {
        params: {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        },
      })
      .then((res) => {
        const availableRooms = res.data
        setRooms(availableRooms)
        setSearchState(availableRooms.length > 0 ? 'success' : 'empty')
      })
      .catch(() => {
        toast.error('Не вдалося отримати список кімнат. Перевірте підключення до сервера.')
        setSearchState('initial')
      })
  }

  // Обробник бронювання
  const handleBook = async (room: Room) => {
    if (!isAuthenticated) {
      toast('Будь ласка, увійдіть у систему для бронювання')
      setIsAuthOpen(true)
      return
    }

    if (!startTime || !endTime) {
      toast.error('Оберіть бажаний час для бронювання')
      return
    }

    try {
      await apiClient.post('/bookings', {
        room_id: room.id,
        user_id: user?.id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })
      toast.success(`Кімнату «${room.name}» успішно заброньовано!`)
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('Кімната вже зайнята на цей час')
      } else {
        toast.error(err.response?.data?.message || 'Помилка при бронюванні')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e5e5] p-4 sm:p-8 flex flex-col items-center">
      
      {/* Головний контейнер-картка (max-width ~900px, rounded 12px, border 1px) */}
      <main className="w-full max-w-[900px] bg-[#1a1a1a] rounded-[12px] border border-[#2a2a2a] overflow-hidden shadow-2xl">
        
        {/* Навбар: динамічно адаптується до ролі та стану авторизації */}
        <Navbar 
          activeTab={activeTab} 
          onSelectTab={setActiveTab} 
          onOpenAuth={() => setIsAuthOpen(true)} 
        />

        {/* 1. Вкладка "Кімнати" (Пошук та бронювання) */}
        {activeTab === 'rooms' && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Секція пошуку */}
            <section className="space-y-3">
              <h1 className="text-[18px] font-medium text-white tracking-tight">
                Знайти вільну кімнату
              </h1>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                {/* Поле "Початок" */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="start-time" className="text-xs text-neutral-400 font-normal">
                    Початок
                  </label>
                  <input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Поле "Кінець" */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="end-time" className="text-xs text-neutral-400 font-normal">
                    Кінець
                  </label>
                  <input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Кнопка "Знайти" */}
                <button
                  type="submit"
                  className="h-[38px] px-6 bg-white text-neutral-900 text-sm font-medium rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all shrink-0 cursor-pointer"
                >
                  Знайти
                </button>
              </form>
            </section>

            {/* Результати та стани */}
            <section className="space-y-3 pt-2">
              
              {/* Стан: До пошуку */}
              {searchState === 'initial' && (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-400 border border-dashed border-[#2a2a2a] rounded-[12px] bg-[#161616]/40">
                  <Calendar className="w-8 h-8 text-neutral-600 mb-2" />
                  <p className="text-sm font-medium text-neutral-300">
                    Оберіть час і натисніть «Знайти»
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Вкажіть бажаний проміжок часу, щоб перевірити доступні переговорні
                  </p>
                </div>
              )}

              {/* Стан: Завантаження (Скелетони) */}
              {searchState === 'loading' && (
                <div className="space-y-3">
                  <div className="h-4 w-28 bg-neutral-800/80 rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((skeletonId) => (
                      <div
                        key={skeletonId}
                        className="border border-[#2a2a2a] bg-[#202020]/50 rounded-[12px] p-4 flex flex-col justify-between h-[134px] animate-pulse"
                      >
                        <div>
                          <div className="h-5 w-2/3 bg-neutral-700/60 rounded mb-2" />
                          <div className="h-3 w-1/3 bg-neutral-800 rounded" />
                        </div>
                        <div className="h-8 w-full bg-neutral-800 rounded-[8px]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Стан: Порожній результат */}
              {searchState === 'empty' && (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-400 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a]">
                  <Clock className="w-8 h-8 text-neutral-600 mb-2" />
                  <p className="text-sm font-medium text-neutral-300">
                    На цей час вільних кімнат немає
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Спробуйте обрати інший часовий інтервал
                  </p>
                </div>
              )}

              {/* Стан: Результати пошуку */}
              {searchState === 'success' && (
                <div className="space-y-3">
                  <div className="text-xs text-neutral-400 font-normal">
                    Вільно: {rooms.length} {rooms.length === 1 ? 'кімната' : rooms.length < 5 ? 'кімнати' : 'кімнат'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="border border-[#2a2a2a] bg-[#202020]/70 rounded-[12px] p-4 flex flex-col justify-between hover:border-neutral-600 transition-colors"
                      >
                        <div>
                          <h2 className="text-[16px] font-semibold text-white tracking-tight">
                            {room.name}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{room.capacity} місць</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBook(room)}
                          className="w-full mt-4 py-2 text-sm font-medium text-neutral-200 bg-transparent border border-neutral-700 rounded-[8px] hover:border-neutral-400 hover:bg-neutral-800/80 transition-colors cursor-pointer text-center"
                        >
                          Забронювати
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </section>
          </div>
        )}

        {/* 2. Вкладка "Керування кімнатами" (Лише Admin) */}
        {activeTab === 'admin-rooms' && (
          <div className="p-5 sm:p-6 space-y-6">
            <h1 className="text-[18px] font-medium text-white tracking-tight">
              Керування кімнатами
            </h1>

            {/* Форма створення нової кімнати */}
            <form onSubmit={handleCreateRoom} className="p-4 bg-[#202020]/60 border border-[#2a2a2a] rounded-[12px] space-y-3">
              <h2 className="text-sm font-semibold text-white">Додати нову переговорну</h2>
              
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                {/* Назва */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="room-name" className="text-xs text-neutral-400 font-normal">
                    Назва кімнати
                  </label>
                  <input
                    id="room-name"
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Наприклад: Нептун"
                    className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Місткість */}
                <div className="w-full sm:w-36 flex flex-col gap-1.5">
                  <label htmlFor="room-capacity" className="text-xs text-neutral-400 font-normal">
                    Місткість (місць)
                  </label>
                  <input
                    id="room-capacity"
                    type="number"
                    min="1"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(e.target.value)}
                    placeholder="6"
                    className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Кнопка створення */}
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="h-[38px] px-5 bg-white text-neutral-900 text-sm font-medium rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingRoom ? 'Створення...' : 'Створити кімнату'}
                </button>
              </div>
            </form>

            {/* Список кімнат */}
            <div className="space-y-3">
              <h2 className="text-xs text-neutral-400 font-normal">
                Усі кімнати системи ({allRooms.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allRooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-[#2a2a2a] bg-[#202020]/70 rounded-[12px] p-4 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-[16px] font-semibold text-white tracking-tight">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{room.capacity} місць</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Вкладка "Мої броні" (Користувач) */}
        {activeTab === 'my-bookings' && (
          <div className="p-8 text-center text-neutral-400">
            <h2 className="text-lg font-medium text-white mb-2">Мої бронювання</h2>
            <p className="text-sm text-neutral-500">Тут відображатиметься список ваших майбутніх броней з можливістю скасування.</p>
          </div>
        )}

        {/* 4. Вкладка "Усі броні" (Admin) */}
        {activeTab === 'admin-bookings' && (
          <div className="p-8 text-center text-neutral-400">
            <h2 className="text-lg font-medium text-white mb-2">Усі бронювання системи (Admin)</h2>
            <p className="text-sm text-neutral-500">Таблиця всіх броней користувачів з можливістю видалення.</p>
          </div>
        )}

      </main>

      {/* Модальне вікно авторизації */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

    </div>
  )
}
