import { useState } from 'react'
import { X, Calendar, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '../api/client'
import type { Room, Booking } from '../types'

interface BookingModalProps {
  room: Room
  initialStartTime?: string
  initialEndTime?: string
  onClose: () => void
  onSuccess: (booking: Booking) => void
}

function getDefaultTimes() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)

  const end = new Date(now)
  end.setHours(end.getHours() + 1)

  const formatLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return {
    start: formatLocal(now),
    end: formatLocal(end),
  }
}

export default function BookingModal({
  room,
  initialStartTime,
  initialEndTime,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const defaults = getDefaultTimes()
  const [startTime, setStartTime] = useState(initialStartTime || defaults.start)
  const [endTime, setEndTime] = useState(initialEndTime || defaults.end)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!startTime || !endTime) {
      setErrorMessage('Вкажіть час початку та завершення')
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      setErrorMessage('Час початку має бути раніше за час завершення')
      return
    }

    if (start < new Date()) {
      setErrorMessage('Час початку не може бути в минулому')
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post('/bookings', {
        room_id: room.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })

      toast.success(`Кімнату «${room.name}» успішно заброньовано!`)
      onSuccess(response.data)
      onClose()
    } catch (err: any) {
      const status = err.response?.status
      const msg = err.response?.data?.message

      if (status === 409) {
        const text = 'Кімната вже зайнята на обраний час. Будь ласка, оберіть інший інтервал.'
        setErrorMessage(text)
        toast.error(text)
      } else {
        const text = msg || 'Не вдалося створити бронювання'
        setErrorMessage(text)
        toast.error(text)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-[420px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закриття */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div className="mb-5 pr-6">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Бронювання: {room.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <span>Місткість: {room.capacity} осіб</span>
          </div>
        </div>

        {/* Повідомлення про помилку */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-[8px] text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Час початку</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Час завершення</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-[#242424] border border-neutral-700 rounded-[8px] h-[38px] px-3 text-sm text-neutral-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Кнопки дій */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-[38px] px-4 text-xs font-medium text-neutral-300 bg-transparent border border-neutral-700 rounded-[8px] hover:border-neutral-500 hover:bg-neutral-800/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-[38px] px-4 text-xs font-medium bg-white text-neutral-900 rounded-[8px] hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Бронювання...' : 'Підтвердити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
