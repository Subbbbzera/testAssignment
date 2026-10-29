export type Role = 'user' | 'admin'

export interface User {
  id: string
  email: string
  role: Role
}

export interface Room {
  id: string
  name: string
  capacity: number
}

export interface Booking {
  id: string
  room_id: string
  user_id: string
  start_time: string
  end_time: string
  room?: Room
  user?: {
    id: string
    email: string
  }
}
