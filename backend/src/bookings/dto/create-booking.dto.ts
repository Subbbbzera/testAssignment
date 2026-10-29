import { IsISO8601, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  room_id: string;

  @IsISO8601()
  start_time: string;

  @IsISO8601()
  end_time: string;
}
