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
  roomId: string
  userId: string
  startTime: string
  endTime: string
  room?: Room
  user?: {
    id: string
    email: string
  }
}
