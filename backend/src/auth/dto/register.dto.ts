import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некоректний формат email' })
  @IsNotEmpty({ message: 'Email обовʼязковий' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль має містити щонайменше 6 символів' })
  password: string;
}
