import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class GetAvailableRoomsDto {
  @IsNotEmpty({ message: 'start_time обовʼязковий' })
  @IsISO8601({}, { message: 'start_time має бути валідним ISO 8601 форматом дати' })
  start_time: string;

  @IsNotEmpty({ message: 'end_time обовʼязковий' })
  @IsISO8601({}, { message: 'end_time має бути валідним ISO 8601 форматом дати' })
  end_time: string;
}
