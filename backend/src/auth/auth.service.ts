import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Автоматична ініціалізація адміна при запуску застосунку
  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@booking.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin_secret_password_123';

    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await this.prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
          },
        });
        this.logger.log(`👑 Створено адміністратора: ${adminEmail}`);
      } else if (existing.role !== 'admin') {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'admin' },
        });
        this.logger.log(`👑 Оновлено права користувача ${adminEmail} до ролі admin`);
      }
    } catch (error) {
      this.logger.warn(`Попередження при створенні адміна (можливо, ще не виконано міграцію БД): ${error}`);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Користувач з таким email вже зареєстрований');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.email.toLowerCase().includes('admin') ? 'admin' : 'user';

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
