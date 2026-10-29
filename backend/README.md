# Room Booking System — Backend

NestJS + Prisma (PostgreSQL) API для системи бронювання переговорних кімнат.

## Вимоги

- Node.js 18+
- PostgreSQL 14+

## Встановлення

```bash
npm install
```

## Змінні середовища

Створіть файл `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

| Змінна | Опис | Приклад |
|---|---|---|
| `DATABASE_URL` | URL підключення до PostgreSQL | `postgresql://user:pass@localhost:5432/booking_db` |
| `JWT_SECRET` | Секрет для підпису JWT-токенів | `super_secret_key` |
| `ADMIN_EMAIL` | Email адміна (автоствоюється при старті) | `admin@booking.com` |
| `ADMIN_PASSWORD` | Пароль адміна | `admin_secret_password_123` |

## Запуск

```bash
# Розробка (з hot-reload)
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## Ролі

| Роль | Можливості |
|---|---|
| `user` | Бронювання кімнат, перегляд та скасування власних майбутніх броней |
| `admin` | Усі можливості user + створення кімнат, перегляд та видалення будь-яких броней |

> Адмін автоматично створюється при першому запуску сервера з `ADMIN_EMAIL` та `ADMIN_PASSWORD`.

## API

### Auth
| Метод | URL | Опис | Auth |
|---|---|---|---|
| POST | `/auth/register` | Реєстрація | — |
| POST | `/auth/login` | Вхід (повертає cookie `access_token`) | — |
| POST | `/auth/logout` | Вихід | — |
| GET | `/auth/me` | Поточний користувач | JWT |

### Rooms
| Метод | URL | Опис | Auth |
|---|---|---|---|
| GET | `/rooms` | Усі кімнати | — |
| GET | `/rooms/available?start_time=ISO&end_time=ISO` | Доступні кімнати | — |
| POST | `/rooms` | Створити кімнату | admin |

### Bookings
| Метод | URL | Опис | Auth |
|---|---|---|---|
| POST | `/bookings` | Створити бронювання | user |
| GET | `/bookings` | Усі бронювання | admin |
| GET | `/users/:id/bookings` | Майбутні броні користувача | user/admin |
| DELETE | `/bookings/:id` | Скасувати бронювання | user/admin |
