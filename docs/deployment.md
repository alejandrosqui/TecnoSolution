# TecnoSolution — Guía de Deployment

## Prerequisitos

- Docker Desktop 24+ con Compose V2
- Make (en Windows: Git Bash o WSL2)
- Node.js 20+ (para el frontend)
- Python 3.12+ (solo para desarrollo local sin Docker)

---

## Primer Arranque (Development)

```bash
# 1. Clonar y configurar variables
git clone <repo>
cd TecnoSolution
cp .env.example .env
# Editar .env con los valores reales

# 2. Levantar infraestructura + backend
make up

# 3. Ejecutar migraciones
make migrate

# 4. Frontend (en otra terminal)
npm install
npm run dev
```

Servicios disponibles:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/api/docs
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5433

---

## Comandos Make

| Comando                       | Descripción                              |
|-------------------------------|------------------------------------------|
| `make up`                     | Levantar todos los servicios             |
| `make up-dev`                 | Levantar con overrides de desarrollo     |
| `make down`                   | Detener todos los servicios              |
| `make logs`                   | Ver logs en tiempo real                  |
| `make db-shell`               | Entrar a psql interactivo                |
| `make migrate`                | Aplicar migraciones pendientes           |
| `make migrate-create name=x`  | Crear nueva migración con alembic        |
| `make backend-shell`          | Bash dentro del container backend        |
| `make install-backend`        | Reinstalar dependencias Python           |
| `make test-backend`           | Ejecutar pytest                          |

---

## Puertos (para no colisionar con otros proyectos)

| Servicio   | Puerto externo | Puerto interno |
|------------|---------------|----------------|
| PostgreSQL | 5433          | 5432           |
| Redis      | 6380          | 6379           |
| MinIO API  | 9000          | 9000           |
| MinIO UI   | 9001          | 9001           |
| Backend    | 8001          | 8001           |
| Frontend   | 5173          | 5173 (Vite)    |

---

## Producción

En producción se recomienda:
1. Usar un reverse proxy (nginx o Caddy) con TLS.
2. Reemplazar MinIO con AWS S3 o Cloudflare R2 (mismo SDK, solo cambiar variables).
3. Usar un servicio PostgreSQL gestionado (RDS, Supabase, Neon).
4. Usar un servicio Redis gestionado (Upstash, Redis Cloud).
5. Deployar el backend en un servidor con Docker o en Railway/Render.
6. Deployar el frontend como sitio estático en Netlify, Vercel o Cloudflare Pages.

### Variables críticas para producción
- `SECRET_KEY` y `JWT_SECRET`: valores aleatorios de al menos 32 bytes
- `DEBUG=false`
- `APP_ENV=production`
- `DATABASE_URL`: con SSL (`?ssl=require`)
- `ALLOWED_ORIGINS`: solo los dominios del frontend

---

## Backups

```bash
# Backup de PostgreSQL
docker exec tecnosolution-postgres-1 pg_dump -U tecnosolution tecnosolution_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i tecnosolution-postgres-1 psql -U tecnosolution tecnosolution_db < backup_20260101.sql
```
