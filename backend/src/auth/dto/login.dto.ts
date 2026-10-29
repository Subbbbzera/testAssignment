import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некоректний формат email' })
  @IsNotEmpty({ message: 'Email обовʼязковий' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обовʼязковий' })
  password: string;
}
