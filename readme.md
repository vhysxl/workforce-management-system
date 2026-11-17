# Workforce Management System

Aplikasi manajemen karyawan, absensi WFO/WFH, dan izin.

## Arsitektur

```text
React UI → Nginx API Gateway → NestJS Services → MySQL
```

Backend terdiri dari tiga service: **Auth** (login, JWT, aktivasi akun),
**Employee Master** (data karyawan), dan **Attendance** (absensi, izin, unggahan).
Masing-masing memakai database terpisah dalam satu instance MySQL.
Komunikasi antarservice menggunakan HTTP; data database dan unggahan disimpan di Docker volume.

## Port

| Service         | Port container | Akses dari host                  |
| --------------- | -------------- | -------------------------------- |
| UI              | 5173           | http://localhost:5173            |
| API Gateway     | 8000           | http://localhost:8000/api/\*     |
| Auth            | 3001           | Internal Docker                  |
| Employee Master | 3002           | Internal Docker                  |
| Attendance      | 3003           | Internal Docker                  |
| MySQL           | 3306           | localhost:3306 (`root` / `root`) |

## Jalankan dengan Docker Compose

Prasyarat: Docker sudah berjalan dan Docker Compose tersedia.
Dari folder yang berisi `docker-compose.yml`, jalankan:

```bash
docker compose up -d --build
docker compose ps
```

Tunggu inisialisasi database dan service selesai, lalu buka http://localhost:5173.
Gunakan akun admin pada bagian **Akun Seeding** untuk login.

## Limitasi

- **UI:** beberapa komponen masih mencampur pengambilan data, state, dan tampilan; design system serta pengujian UI perlu ditingkatkan (rushed).
- **Database:** indeks untuk pencarian dan filter belum lengkap; query perlu dioptimalkan untuk data besar.
- **Ketahanan antarservice:** HTTP sinkron belum dilengkapi circuit breaker, retry dengan backoff, atau message broker; gangguan satu service dapat menggagalkan request terkait.
- **Keamanan internal:** endpoint internal diblokir di gateway, tetapi komunikasi antarservice belum memakai API key atau mTLS.

## Akun Seeding

Saat Auth Service mulai, script `backend/apps/auth-service/src/seed-admin.ts`
menyiapkan akun admin berikut:

```text
Email: admin@company.com
Password: Admin123*
```
