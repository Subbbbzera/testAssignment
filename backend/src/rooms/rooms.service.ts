import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  // Створення кімнати (тільки admin)
  async create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        capacity: dto.capacity,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
      },
    });
  }

  // Пошук вільних кімнат у заданий часовий інтервал (публічний)
  async findAvailable(startTimeIso: string, endTimeIso: string) {
    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Невалідний ISO формат дати');
    }

    if (start >= end) {
      throw new BadRequestException('Час початку має бути раніше за час закінчення');
    }

    // Математика неперетину інтервалів:
    // Кімната вільна, якщо у неї немає жодного бронювання (none),
    // де booking.startTime < end ТА booking.endTime > start
    return this.prisma.room.findMany({
      where: {
        bookings: {
          none: {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gt: start } },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        capacity: true,
      },
      orderBy: {
        capacity: 'asc',
      },
    });
  }

  // Список усіх кімнат (для адмін-панелі чи загального огляду)
  async findAll() {
    return this.prisma.room.findMany({
      select: {
        id: true,
        name: true,
        capacity: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Пошук однієї кімнати за id
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        capacity: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Кімнату з id "${id}" не знайдено`);
    }

    return room;
  }
}
