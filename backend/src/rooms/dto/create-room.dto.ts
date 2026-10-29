import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString({ message: 'Назва кімнати має бути рядком' })
  @IsNotEmpty({ message: 'Назва кімнати обовʼязкова' })
  name: string;

  @Type(() => Number)
  @IsInt({ message: 'Місткість має бути цілим числом' })
  @Min(1, { message: 'Місткість має бути щонайменше 1 місце' })
  capacity: number;
}
