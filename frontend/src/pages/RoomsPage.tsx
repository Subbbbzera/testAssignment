import { useState, useEffect, useCallback } from 'react'
import { Users, Calendar, Clock, Trash2, RefreshCw, CalendarPlus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import BookingModal from '../components/BookingModal'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../api/client'
import type { Room, Booking } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RoomsPage() {
  const { isAuthenticated, user, isAdmin } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('rooms')

  // Стан модалки бронювання
  const [bookingModalRoom, setBookingModalRoom] = useState<Room | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Форма дат пошуку
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Стан пошуку доступних кімнат
  const [searchState, setSearchState] = useState<'initial' | 'loading' | 'success' | 'empty'>('initial')
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])

  // Усі кімнати системи (для каталогу та адмінки)
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [allRoomsLoading, setAllRoomsLoading] = useState(false)

  // Стан адмін-панелі створення кімнат
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // Мої броні
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [myBookingsState, setMyBookingsState] = useState<'loading' | 'success' | 'empty' | 'error'>('loading')
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)

  // Усі броні (admin)
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [allBookingsState, setAllBookingsState] = useState<'loading' | 'success' | 'empty' | 'error'>('loading')
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null)

  // Завантаження каталогу всіх кімнат
  const fetchAllRooms = useCallback(async () => {
    setAllRoomsLoading(true)
    try {
      const res = await apiClient.get('/rooms')
      if (Array.isArray(res.data)) {
        setAllRooms(res.data)
      }
    } catch {
      toast.error('Не вдалося завантажити перелік кімнат')
    } finally {
      setAllRoomsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllRooms()
  }, [fetchAllRooms])

  // Завантажуємо мої броні
  const fetchMyBookings = useCallback(async () => {
    if (!user?.id) return
    setMyBookingsState('loading')
    try {
      const res = await apiClient.get(`/users/${user.id}/bookings`)
      const data: Booking[] = res.data
      setMyBookings(data)
      setMyBookingsState(data.length > 0 ? 'success' : 'empty')
    } catch {
      setMyBookingsState('error')
      toast.error('Не вдалося завантажити ваші бронювання')
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'my-bookings' && user?.id) {
      fetchMyBookings()
    }
  }, [activeTab, user, fetchMyBookings])

  // Завантажуємо усі броні (admin)
  const fetchAllBookings = useCallback(async () => {
    if (!isAdmin) return
    setAllBookingsState('loading')
    try {
      const res = await apiClient.get('/bookings')
      const data: Booking[] = res.data
      setAllBookings(data)
      setAllBookingsState(data.length > 0 ? 'success' : 'empty')
    } catch {
      setAllBookingsState('error')
      toast.error('Не вдалося завантажити усі бронювання')
    }
  }, [isAdmin])

  useEffect(() => {
    if (activeTab === 'admin-bookings' && isAdmin) {
      fetchAllBookings()
    }
  }, [activeTab, isAdmin, fetchAllBookings])

  // Відкриття модалки бронювання для конкретної кімнати
  const handleOpenBookingModal = (room: Room) => {
    if (!isAuthenticated) {
      toast('Будь ласка, увійдіть у систему для бронювання')
      setIsAuthOpen(true)
      return
    }
    setBookingModalRoom(room)
    setIsBookingModalOpen(true)
  }

  // Швидке бронювання одразу за обраним у пошуку часом
  const handleDirectBook = async (room: Room) => {
    if (!isAuthenticated) {
      toast('Будь ласка, увійдіть у систему для бронювання')
      setIsAuthOpen(true)
      return
    }

    if (!startTime || !endTime) {
      handleOpenBookingModal(room)
      return
    }

    try {
      await apiClient.post('/bookings', {
        room_id: room.id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })

      // Видаляємо щойно заброньовану кімнату зі списку вільних на цей проміжок
      setAvailableRooms((prev) => prev.filter((r) => r.id !== room.id))
      toast.success(
        <span>
          Кімнату «{room.name}» заброньовано!{' '}
          <button
            onClick={() => setActiveTab('my-bookings')}
            className="underline font-semibold ml-1 cursor-pointer"
          >
            Переглянути броні
          </button>
        </span>
      )
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('Кімната вже зайнята на цей час')
      } else {
        toast.error(err.response?.data?.message || 'Помилка при бронюванні')
      }
    }
  }

  // Скасування бронювання (користувач)
  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Скасувати бронювання кімнати «${booking.room?.name || 'кімната'}»?`)) return

    setCancellingBookingId(booking.id)
    try {
      await apiClient.delete(`/bookings/${booking.id}`)
      setMyBookings((prev) => {
        const next = prev.filter((b) => b.id !== booking.id)
        if (next.length === 0) setMyBookingsState('empty')
        return next
      })
      toast.success('Бронювання успішно скасовано')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Помилка при скасуванні')
    } finally {
      setCancellingBookingId(null)
    }
  }

  // Видалення бронювання (admin)
  const handleDeleteBooking = async (booking: Booking) => {
    const label = `${booking.user?.email ?? 'користувача'} — ${booking.room?.name ?? 'кімната'}`
    if (!window.confirm(`Видалити бронювання: ${label}?`)) return

    setDeletingBookingId(booking.id)
    try {
      await apiClient.delete(`/bookings/${booking.id}`)
      setAllBookings((prev) => {
        const next = prev.filter((b) => b.id !== booking.id)
        if (next.length === 0) setAllBookingsState('empty')
        return next
      })
      toast.success('Бронювання видалено')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Помилка при видаленні')
    } finally {
      setDeletingBookingId(null)
    }
  }

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

  // Обробник пошуку доступних кімнат
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

    apiClient
      .get('/rooms/available', {
        params: {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        },
      })
      .then((res) => {
        const rooms = res.data
        setAvailableRooms(rooms)
        setSearchState(rooms.length > 0 ? 'success' : 'empty')
      })
      .catch(() => {
        toast.error('Не вдалося отримати список кімнат. Перевірте звʼязок із сервером.')
        setSearchState('initial')
      })
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e5e5] p-4 sm:p-8 flex flex-col items-center">
      <main className="w-full max-w-[900px] bg-[#1a1a1a] rounded-[12px] border border-[#2a2a2a] overflow-hidden shadow-2xl">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* 1. Вкладка «Кімнати» */}
        {activeTab === 'rooms' && (
          <div className="p-5 sm:p-6 space-y-7">
            {/* Секція пошуку доступних кімнат за інтервалом */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[18px] font-medium text-white tracking-tight">
                  Пошук вільної кімнати
                </h1>
                {searchState !== 'initial' && (
                  <button
                    onClick={() => {
                      setSearchState('initial')
                      setStartTime('')
                      setEndTime('')
                    }}
                    className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Скинути пошук
                  </button>
                )}
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
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

                <button
                  type="submit"
                  className="h-[38px] px-6 bg-white text-neutral-900 text-sm font-medium rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all shrink-0 cursor-pointer"
                >
                  Знайти вільні
                </button>
              </form>
            </section>

            {/* Результати пошуку */}
            {searchState !== 'initial' && (
              <section className="space-y-3 pt-2 border-t border-[#2a2a2a]">
                <h2 className="text-xs text-neutral-400 font-normal uppercase tracking-wider">
                  Результати пошуку
                </h2>

                {searchState === 'loading' && (
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
                )}

                {searchState === 'empty' && (
                  <div className="py-10 flex flex-col items-center justify-center text-center text-neutral-400 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a]">
                    <Clock className="w-8 h-8 text-neutral-600 mb-2" />
                    <p className="text-sm font-medium text-neutral-300">На обраний час вільних кімнат немає</p>
                    <p className="text-xs text-neutral-500 mt-1">Спробуйте інший проміжок часу або оберіть кімнату нижче</p>
                  </div>
                )}

                {searchState === 'success' && (
                  <div className="space-y-3">
                    <div className="text-xs text-neutral-400">
                      Знайдено вільних: {availableRooms.length}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {availableRooms.map((room) => (
                        <div
                          key={room.id}
                          className="border border-[#2a2a2a] bg-[#202020]/80 rounded-[12px] p-4 flex flex-col justify-between hover:border-sky-500/50 transition-colors"
                        >
                          <div>
                            <h3 className="text-[16px] font-semibold text-white tracking-tight">{room.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                              <Users className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{room.capacity} місць</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDirectBook(room)}
                            className="w-full mt-4 py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-[8px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            Забронювати на цей час
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Каталог усіх кімнат із кнопками швидкого бронювання */}
            <section className="space-y-3 pt-2 border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Усі переговорні кімнати</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Оберіть кімнату та натисніть «Забронювати»</p>
                </div>
                <button
                  onClick={fetchAllRooms}
                  disabled={allRoomsLoading}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  title="Оновити перелік кімнат"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${allRoomsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {allRoomsLoading && allRooms.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-[#2a2a2a] bg-[#202020]/40 rounded-[12px] p-4 h-[110px] animate-pulse" />
                  ))}
                </div>
              ) : allRooms.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-[#2a2a2a] rounded-[12px]">
                  Ще не додано жодної кімнати.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allRooms.map((room) => (
                    <div
                      key={room.id}
                      className="border border-[#2a2a2a] bg-[#202020]/60 rounded-[12px] p-4 flex flex-col justify-between hover:border-neutral-600 transition-colors"
                    >
                      <div>
                        <h3 className="text-[15px] font-semibold text-white tracking-tight">{room.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{room.capacity} місць</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenBookingModal(room)}
                        className="w-full mt-3 py-2 text-xs font-medium text-neutral-200 bg-[#2a2a2a] border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-700 rounded-[8px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-sky-400" />
                        Забронювати
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. Вкладка «Керування кімнатами» (Admin) */}
        {activeTab === 'admin-rooms' && (
          <div className="p-5 sm:p-6 space-y-6">
            <h1 className="text-[18px] font-medium text-white tracking-tight">Керування кімнатами</h1>

            {/* Форма створення нової кімнати */}
            <form onSubmit={handleCreateRoom} className="p-4 bg-[#202020]/60 border border-[#2a2a2a] rounded-[12px] space-y-3">
              <h2 className="text-sm font-semibold text-white">Додати нову переговорну</h2>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="room-name" className="text-xs text-neutral-400 font-normal">Назва кімнати</label>
                  <input
                    id="room-name"
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Наприклад: Нептун"
                    className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="w-full sm:w-36 flex flex-col gap-1.5">
                  <label htmlFor="room-capacity" className="text-xs text-neutral-400 font-normal">Місткість (місць)</label>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoomName('')
                      setNewRoomCapacity('')
                    }}
                    className="h-[38px] px-3 text-xs text-neutral-400 border border-neutral-700 rounded-[8px] hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Очистити
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRoom}
                    className="h-[38px] px-5 bg-white text-neutral-900 text-sm font-medium rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingRoom ? 'Створення...' : 'Створити кімнату'}
                  </button>
                </div>
              </div>
            </form>

            {/* Список кімнат */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs text-neutral-400 font-normal">Усі кімнати системи ({allRooms.length})</h2>
                <button
                  onClick={fetchAllRooms}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Оновити
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allRooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-[#2a2a2a] bg-[#202020]/70 rounded-[12px] p-4 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-[16px] font-semibold text-white tracking-tight">{room.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{room.capacity} місць</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenBookingModal(room)}
                      className="mt-3 py-1.5 text-xs text-neutral-300 border border-neutral-700 hover:border-neutral-500 rounded-[6px] transition-colors cursor-pointer"
                    >
                      Забронювати
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Вкладка «Мої броні» (User) */}
        {activeTab === 'my-bookings' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-[18px] font-medium text-white tracking-tight">Мої бронювання</h1>
              <button
                onClick={fetchMyBookings}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2c2c2c] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Оновити
              </button>
            </div>

            {myBookingsState === 'loading' && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-[#2a2a2a] bg-[#202020]/50 rounded-[12px] p-4 h-[72px] animate-pulse" />
                ))}
              </div>
            )}

            {myBookingsState === 'empty' && (
              <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-[#2a2a2a] rounded-[12px] bg-[#161616]/40 p-6 space-y-3">
                <Calendar className="w-8 h-8 text-neutral-600 mb-1" />
                <p className="text-sm font-medium text-neutral-300">У вас немає майбутніх бронювань</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Оберіть вільну переговорну кімнату для запланованої зустрічі
                </p>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-900 bg-white rounded-[8px] hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Знайти і забронювати кімнату
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {myBookingsState === 'error' && (
              <div className="py-8 text-center text-red-400 text-sm">
                Не вдалося завантажити бронювання. Спробуйте оновити сторінку.
              </div>
            )}

            {myBookingsState === 'success' && (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-[#2a2a2a] bg-[#202020]/70 rounded-[12px] p-4 flex items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{booking.room?.name}</p>
                        {booking.room?.capacity && (
                          <span className="text-[11px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                            {booking.room.capacity} місць
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        {formatDate(booking.startTime)} — {formatDate(booking.endTime)}
                      </p>
                    </div>

                    {/* Кнопка скасування бронювання */}
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingBookingId === booking.id}
                      className="shrink-0 flex items-center gap-1.5 text-xs text-red-400 border border-red-900/60 rounded-[8px] px-3.5 py-2 hover:bg-red-900/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                      title="Скасувати бронювання"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {cancellingBookingId === booking.id ? 'Скасування...' : 'Скасувати'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Вкладка «Усі броні» (Admin) */}
        {activeTab === 'admin-bookings' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-[18px] font-medium text-white tracking-tight">Усі бронювання</h1>
              <button
                onClick={fetchAllBookings}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2c2c2c] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Оновити
              </button>
            </div>

            {allBookingsState === 'loading' && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-[#2a2a2a] bg-[#202020]/50 rounded-[12px] p-4 h-[72px] animate-pulse" />
                ))}
              </div>
            )}

            {allBookingsState === 'empty' && (
              <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-[#2a2a2a] rounded-[12px] bg-[#161616]/40">
                <Calendar className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-sm font-medium text-neutral-300">Ще жодного бронювання</p>
              </div>
            )}

            {allBookingsState === 'error' && (
              <div className="py-8 text-center text-red-400 text-sm">
                Не вдалося завантажити бронювання. Спробуйте оновити сторінку.
              </div>
            )}

            {allBookingsState === 'success' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-neutral-500 border-b border-[#2a2a2a]">
                      <th className="pb-2 pr-4 font-normal">Користувач</th>
                      <th className="pb-2 pr-4 font-normal">Кімната</th>
                      <th className="pb-2 pr-4 font-normal">Початок</th>
                      <th className="pb-2 pr-4 font-normal">Кінець</th>
                      <th className="pb-2 font-normal text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#202020]/50 transition-colors">
                        <td className="py-3 pr-4 text-neutral-300">{booking.user?.email}</td>
                        <td className="py-3 pr-4 text-neutral-200 font-medium">{booking.room?.name}</td>
                        <td className="py-3 pr-4 text-neutral-400">{formatDate(booking.startTime)}</td>
                        <td className="py-3 pr-4 text-neutral-400">{formatDate(booking.endTime)}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteBooking(booking)}
                            disabled={deletingBookingId === booking.id}
                            className="inline-flex items-center gap-1 text-xs text-red-400 border border-red-900/60 rounded-[6px] px-2.5 py-1 hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Видалити бронювання"
                          >
                            <Trash2 className="w-3 h-3" />
                            {deletingBookingId === booking.id ? 'Видалення...' : 'Видалити'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Модальне вікно авторизації */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Модальне вікно бронювання кімнати */}
      {isBookingModalOpen && bookingModalRoom && (
        <BookingModal
          room={bookingModalRoom}
          initialStartTime={startTime}
          initialEndTime={endTime}
          onClose={() => {
            setIsBookingModalOpen(false)
            setBookingModalRoom(null)
          }}
          onSuccess={() => {
            // Якщо користувач на вкладці «Мої броні», оновлюємо
            if (activeTab === 'my-bookings') {
              fetchMyBookings()
            }
          }}
        />
      )}
    </div>
  )
}
