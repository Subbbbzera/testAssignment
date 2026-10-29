import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto, userId: string) {
    const start = new Date(dto.start_time);
    const end = new Date(dto.end_time);

    if (start >= end) {
      throw new BadRequestException('Час початку має бути раніше часу завершення');
    }

    const room = await this.prisma.room.findUnique({ where: { id: dto.room_id } });
    if (!room) throw new NotFoundException('Кімнату не знайдено');

    const conflict = await this.prisma.booking.findFirst({
      where: {
        roomId: dto.room_id,
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (conflict) {
      throw new ConflictException('Кімната вже зайнята на цей час');
    }

    return this.prisma.booking.create({
      data: {
        roomId: dto.room_id,
        userId,
        startTime: start,
        endTime: end,
      },
      include: {
        room: true,
        user: { select: { id: true, email: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        room: true,
        user: { select: { id: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        userId,
        startTime: { gt: new Date() },
      },
      include: {
        room: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async remove(id: string, requestingUser: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Бронювання не знайдено');

    if (requestingUser.role !== 'admin') {
      if (booking.userId !== requestingUser.id) {
        throw new ForbiddenException('Ви не можете скасувати чуже бронювання');
      }
      if (booking.startTime <= new Date()) {
        throw new ForbiddenException('Не можна скасувати бронювання, що вже почалося або завершилося');
      }
    }

    await this.prisma.booking.delete({ where: { id } });
  }
}
