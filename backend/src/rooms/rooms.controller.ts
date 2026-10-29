import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { GetAvailableRoomsDto } from './dto/get-available-rooms.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // 1. POST /rooms (лише admin) {name, capacity} -> 201 Room
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  // 2. GET /rooms/available?start_time=ISO&end_time=ISO -> 200 Room[] (публічний)
  // Важливо: маршрут 'available' розташований вище за ':id'
  @Get('available')
  findAvailable(@Query() query: GetAvailableRoomsDto) {
    return this.roomsService.findAvailable(query.start_time, query.end_time);
  }

  // 3. GET /rooms -> 200 Room[] (список усіх кімнат)
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  // 4. GET /rooms/:id -> 200 Room
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }
}
