import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('bookings')
  @HttpCode(201)
  create(@Body() dto: CreateBookingDto, @Request() req: any) {
    return this.bookingsService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('bookings')
  findAll() {
    return this.bookingsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:id/bookings')
  findUserBookings(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Доступ заборонено');
    }
    return this.bookingsService.findUserBookings(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('bookings/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.bookingsService.remove(id, req.user);
  }
}
