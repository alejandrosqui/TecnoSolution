# TecnoSolution — Arquitectura del Sistema

## 1. Visión General

TecnoSolution es un SaaS multi-tenant de gestión de talleres técnicos de reparación de dispositivos. Permite a una empresa (company) operar uno o varios locales (branches), gestionar órdenes de trabajo (work orders), presupuestos, clientes, técnicos, stock de piezas, y enviar notificaciones automáticas. Los clientes finales pueden consultar el estado de su reparación sin iniciar sesión.

El sistema opera bajo un modelo de suscripción con tres planes:

| Plan        | Locales | Órdenes/mes | Usuarios | Stock | Garantías | Email avanzado |
|-------------|---------|-------------|----------|-------|-----------|----------------|
| Gratuito    | 1       | 10          | 2        | No    | No        | No             |
| Profesional | 1       | Ilimitadas  | 10       | Sí    | Sí        | No             |
| Enterprise  | N       | Ilimitadas  | N        | Sí    | Sí        | Sí             |

---

## 2. Stack Tecnológico

### Frontend — React 18 + TypeScript + Vite
**Justificación:** Vite provee HMR extremadamente rápido. React con TypeScript garantiza tipado estático desde la UI hasta los contratos de API. El proyecto fue iniciado con Lovable (scaffolding), manteniendo la estructura en `src/marketing/` para la landing pública y `src/app/` para el panel autenticado.

- **Routing:** React Router v6
- **State:** Zustand (store global liviano) + React Query (server state y cache)
- **UI:** shadcn/ui (Radix UI + Tailwind CSS) — componentes accesibles y personalizables sin lock-in de librería UI
- **Animaciones:** Framer Motion (landing page)
- **Formularios:** React Hook Form + Zod

### Backend — FastAPI + Python 3.12
**Justificación:** FastAPI provee tipado con Pydantic, documentación OpenAPI automática, soporte async nativo con asyncio, y excelente performance. Python es el estándar de facto para backends de SaaS modernos con ORM maduro.

- **ORM:** SQLAlchemy 2.0 async
- **Migraciones:** Alembic
- **Auth:** JWT (python-jose) + bcrypt (passlib)
- **Email:** Resend (API transaccional moderna, alternativa a SendGrid)

### Base de Datos — PostgreSQL 16
**Justificación:** ACID, soporte JSON nativo para campos flexibles, row-level security si se necesita en el futuro, amplio ecosistema. Puerto 5433 para no colisionar con instancias locales por defecto (5432).

### Object Storage — MinIO
**Justificación:** Compatible con S3 API, self-hosted, sin costo por GB en desarrollo. En producción se puede reemplazar transparentemente con AWS S3 o Cloudflare R2 cambiando solo las variables de entorno. Los metadatos (nombre, mime type, tamaño, object_key) se guardan en PostgreSQL; los blobs solo en MinIO.

### Cache y Rate Limiting — Redis 7
**Justificación:** Usado para: cache de sesiones, rate limiting por IP/usuario, cola de tareas background (Celery opcional en el futuro). Puerto 6380 para no colisionar con Redis locales por defecto.

### Contenedores — Docker Compose
**Justificación:** Paridad dev/prod, onboarding en un solo comando (`make up`), volúmenes nombrados para persistencia, healthchecks para dependencias ordenadas.

---

## 3. Módulos del Sistema

### 3.1 Marketing (`src/marketing/`)
Landing page pública: presentación del producto, características, precios, y call to action. No requiere autenticación. Completamente separado del panel interno para facilitar deploys independientes o conversión a Next.js/Astro en el futuro.

### 3.2 App Panel (`src/app/`)
Panel autenticado para superadmin, admin_local y técnico. Incluye gestión de órdenes, clientes, stock, presupuestos, y reportes según el plan contratado.

- `components/` — componentes específicos del panel (tablas, formularios, dashboards)
- `pages/` — páginas/rutas del panel
- `hooks/` — hooks específicos del panel (useWorkOrders, useAuth, etc.)
- `services/` — funciones de acceso a la API del backend (axios/fetch wrappers)
- `store/` — Zustand stores (authStore, uiStore, notificationStore)

### 3.3 Shared (`src/shared/`)
Código compartido entre marketing y app: componentes shadcn/ui, hooks genéricos (useIsMobile, useToast), utilidades (cn), y tipos TypeScript globales.

### 3.4 Backend — Auth (`backend/app/routers/auth.py`)
Login, logout, refresh de tokens JWT, y endpoint `/me` para obtener el usuario autenticado con sus permisos y branches asignados.

### 3.5 Backend — Companies & Branches
Multi-tenant: una Company tiene N branches. El superadmin gestiona companies; el admin_local gestiona su branch. Las órdenes, usuarios, clientes y stock siempre pertenecen a un branch.

### 3.6 Backend — Work Orders
Núcleo del sistema. Gestión del ciclo de vida completo de una reparación: creación, diagnóstico, presupuesto, aprobación, reparación, entrega, garantía. Incluye historial de estados, fotos, firma digital del cliente, y notas internas.

### 3.7 Backend — Quotes
Un trabajo puede tener uno o más presupuestos. El cliente aprueba o rechaza. El presupuesto aprobado genera los ítems del trabajo.

### 3.8 Backend — Stock (`products`, `stock_movements`)
Gestión de piezas y repuestos. Movimientos de entrada/salida vinculados a órdenes de trabajo. Solo disponible en planes Profesional y Enterprise (controlado por middleware).

### 3.9 Backend — Plans & Subscriptions
Gestión de planes SaaS. El middleware `plan_limits.py` intercepta cada request y verifica los contadores de uso contra los límites del plan activo. Si se excede, retorna HTTP 402.

### 3.10 Backend — Public API
Endpoint sin autenticación que permite a clientes consultar el estado de su reparación por número de orden. Devuelve estado, descripción, fecha estimada, y si hay fotos visibles para el cliente.

### 3.11 Backend — Storage
Servicio interno para subir/descargar archivos de MinIO. Los endpoints de photos y documents generan URLs pre-firmadas temporales para acceso directo desde el frontend sin pasar por el backend.

### 3.12 Backend — Notifications
Envío de emails via Resend en eventos clave: orden recibida, presupuesto listo, reparación completada, garantía activada. En plan Enterprise: emails personalizados con branding del taller.

---

## 4. Estructura de Carpetas

```
TecnoSolution/
├── backend/                    ← API Python/FastAPI
│   ├── app/
│   │   ├── main.py             ← entrypoint, registro de routers y middleware
│   │   ├── core/
│   │   │   ├── config.py       ← settings via pydantic-settings + .env
│   │   │   ├── security.py     ← JWT, password hashing
│   │   │   └── database.py     ← async SQLAlchemy engine, Base, get_session
│   │   ├── models/             ← SQLAlchemy ORM models (una clase = una tabla)
│   │   ├── schemas/            ← Pydantic schemas (request/response shapes)
│   │   ├── routers/            ← FastAPI APIRouter por dominio de negocio
│   │   ├── services/           ← lógica de negocio, sin acceso directo a HTTP
│   │   ├── middleware/         ← plan_limits, auth bearer extraction
│   │   └── utils/              ← helpers: paginación, storage client, email
│   ├── alembic/                ← migraciones de base de datos
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── src/
│   ├── marketing/              ← landing page pública
│   │   ├── components/         ← HeroSection, FeaturesSection, etc.
│   │   └── pages/
│   │       └── LandingPage.tsx ← página raíz "/"
│   ├── app/                    ← panel autenticado (a implementar)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/           ← wrappers de API calls al backend
│   │   └── store/              ← Zustand stores
│   ├── shared/                 ← código compartido
│   │   ├── components/ui/      ← shadcn/ui components
│   │   ├── hooks/              ← use-mobile, use-toast
│   │   ├── lib/utils.ts        ← cn() y otros helpers
│   │   └── types/index.ts      ← tipos TypeScript globales
│   ├── App.tsx                 ← router principal
│   ├── main.tsx
│   └── index.css
├── docs/                       ← documentación de arquitectura y contratos
├── docker-compose.yml          ← stack completo de producción/staging
├── docker-compose.dev.yml      ← overrides para desarrollo local
├── .env.example                ← plantilla de variables de entorno
└── Makefile                    ← comandos de operación
```

---

## 5. Modelo de Datos (Entidades Principales)

### Tenancy
- **companies**: id, name, slug, logo_url, created_at
- **branches**: id, company_id, name, address, phone, timezone, is_active
- **plans**: id, slug (free|professional|enterprise), name, price_monthly, price_yearly
- **subscriptions**: id, company_id, plan_id, status, current_period_start, current_period_end
- **plan_limits**: id, plan_id, max_branches, max_users, max_orders_per_month, has_stock, has_warranties, has_advanced_email
- **usage_counters**: id, company_id, branch_id, period (YYYY-MM), orders_count, users_count

### Users & Access
- **users**: id, email, hashed_password, full_name, phone, is_active, is_superadmin, created_at
- **user_branch_access**: id, user_id, branch_id, role (admin_local|tecnico)

### Customers
- **customers**: id, branch_id, full_name, email, phone, dni, address, created_at

### Devices
- **devices**: id, customer_id, brand, model, device_type (phone|tablet|laptop|other), serial_number, imei, color, accessories, created_at

### Work Orders
- **work_orders**: id, branch_id, customer_id, device_id, order_number (unique), status, assigned_tecnico_id, problem_description, diagnosis_notes, estimated_cost, final_cost, estimated_ready_date, received_at, delivered_at, is_warranty_claim, original_order_id, created_at, updated_at
- **work_order_status_history**: id, work_order_id, from_status, to_status, changed_by_user_id, note, changed_at
- **work_order_photos**: id, work_order_id, storage_object_id, visible_to_customer, taken_at
- **work_order_signatures**: id, work_order_id, storage_object_id, signed_at
- **work_order_items**: id, work_order_id, description, quantity, unit_price, total_price
- **work_order_notes**: id, work_order_id, user_id, content, is_internal, created_at

### Quotes
- **quotes**: id, work_order_id, status (draft|sent|approved|rejected|expired), total, valid_until, created_by_user_id, created_at
- **quote_items**: id, quote_id, description, quantity, unit_price, total_price
- **quote_status_history**: id, quote_id, from_status, to_status, changed_at, note

### Stock
- **products**: id, branch_id, sku, name, description, unit_cost, stock_qty, min_stock_alert, is_active
- **stock_movements**: id, product_id, work_order_id (nullable), movement_type (in|out|adjustment), qty, note, created_by_user_id, created_at

### Warranties & Documents
- **warranties**: id, work_order_id, duration_days, starts_at, expires_at, terms
- **warranty_claims**: id, warranty_id, work_order_id (nueva orden), description, claimed_at
- **documents**: id, branch_id, work_order_id (nullable), doc_type (invoice|receipt|report), storage_object_id, created_at
- **storage_objects**: id, bucket, object_key, original_filename, mime_type, size_bytes, uploaded_by_user_id, uploaded_at

### Notifications
- **email_events**: id, to_email, subject, template, status (queued|sent|failed), sent_at, error_message
- **notification_logs**: id, user_id, work_order_id (nullable), type, message, read_at, created_at

### Estados de Orden
```
received → queued → diagnosing → waiting_customer_approval →
quote_sent → approved | rejected →
waiting_parts → repairing → repaired → ready_for_pickup →
delivered → warranty | cancelled
```

---

## 6. Estrategia de Auth

### JWT + Refresh Token
- **Access token:** expira en 60 minutos. Payload incluye `sub` (user_id), `role`, `branch_ids[]`, `type: access`.
- **Refresh token:** expira en 7 días. Se guarda en `httpOnly cookie`. El endpoint `/api/auth/refresh` emite un nuevo access token sin requerir password.
- Los tokens no se almacenan en BD (stateless). Si se requiere revocación (logout, cambio de rol), se usa una lista de invalidación en Redis con TTL igual al tiempo restante del token.

### Roles

| Rol          | Scope              | Descripción                                              |
|--------------|--------------------|----------------------------------------------------------|
| superadmin   | Plataforma entera  | Acceso total: companies, planes, facturación, soporte    |
| admin_local  | Su branch          | CRUD completo de órdenes, usuarios, clientes, stock      |
| tecnico      | Su branch (lectura/escritura parcial) | Solo ve y gestiona sus órdenes asignadas |

### Multi-tenant
Cada request autenticado extrae `branch_ids` del JWT. El middleware inyecta un filtro automático en todas las queries para que solo devuelvan registros del branch correspondiente. El superadmin no tiene este filtro.

---

## 7. Estrategia de Storage — MinIO

### Buckets
| Bucket              | Contenido                        | Acceso                    |
|---------------------|----------------------------------|---------------------------|
| `work-order-photos` | Fotos antes/durante/después de reparación | URLs pre-firmadas (15 min) |
| `documents`         | PDFs de presupuestos, facturas, recibos  | URLs pre-firmadas (5 min)  |

### Flujo de Upload
1. El cliente solicita al backend una **presigned URL** de upload (PUT).
2. El frontend sube el archivo directamente a MinIO (sin pasar por el backend).
3. El frontend confirma al backend el upload exitoso con el `object_key`.
4. El backend crea el registro en `storage_objects` con metadatos.

### Flujo de Download
1. El frontend solicita al backend una URL de descarga.
2. El backend verifica permisos y genera una presigned URL de GET (TTL corto).
3. El frontend accede directamente a MinIO con esa URL.

### Claves de objeto
Formato: `{branch_id}/{work_order_id}/{timestamp}_{uuid}.{ext}`

---

## 8. Estrategia de Suscripciones

### Planes y Límites

| Límite               | Gratuito | Profesional | Enterprise |
|----------------------|----------|-------------|------------|
| Branches             | 1        | 1           | Sin límite |
| Órdenes/mes          | 10       | Sin límite  | Sin límite |
| Usuarios             | 2        | 10          | Sin límite |
| Stock de productos   | No       | Sí          | Sí         |
| Garantías            | No       | Sí          | Sí         |
| Email avanzado       | No       | No          | Sí         |
| Reportes exportables | No       | Básicos     | Completos  |

### Middleware de Control (`plan_limits.py`)
En cada request a endpoints controlados, el middleware:
1. Extrae `company_id` del JWT.
2. Carga el plan activo desde cache Redis (TTL 5 min).
3. Verifica el `usage_counter` del período actual.
4. Si se excede el límite: retorna `HTTP 402 Payment Required` con detalle del límite alcanzado.
5. Si la feature no está incluida en el plan: retorna `HTTP 403 Forbidden` con `plan_required`.

---

## 9. Roles y Permisos

| Acción                          | superadmin | admin_local | tecnico |
|---------------------------------|:----------:|:-----------:|:-------:|
| Ver/gestionar companies         | Sí         | No          | No      |
| Ver/gestionar branches          | Sí         | Solo propia | No      |
| Invitar usuarios                | Sí         | Sí          | No      |
| Cambiar roles                   | Sí         | Sí*         | No      |
| Ver todas las órdenes del branch| Sí         | Sí          | Solo asignadas |
| Crear/editar órdenes            | Sí         | Sí          | Sí      |
| Cambiar estado de orden         | Sí         | Sí          | Sí      |
| Crear/editar presupuestos       | Sí         | Sí          | Sí      |
| Aprobar/rechazar presupuestos   | Sí         | Sí          | No      |
| Gestionar stock                 | Sí         | Sí          | No      |
| Ver reportes                    | Sí         | Sí          | No      |
| Gestionar planes y suscripciones| Sí         | No          | No      |

*admin_local solo puede asignar roles ≤ admin_local dentro de su branch

---

## 10. Convenciones de Naming

### Base de Datos (PostgreSQL)
- Tablas: `snake_case`, plural (`work_orders`, `quote_items`)
- Columnas: `snake_case` (`created_at`, `branch_id`)
- FK: `{tabla_referenciada_singular}_id` (`customer_id`, `branch_id`)
- Índices: `idx_{tabla}_{columna(s)}` (`idx_work_orders_branch_id`)
- Constraints: `uq_{tabla}_{columnas}`, `chk_{tabla}_{condicion}`

### Backend Python
- Archivos: `snake_case.py`
- Clases: `PascalCase`
- Variables/funciones: `snake_case`
- Constantes: `UPPER_SNAKE_CASE`
- Schemas Pydantic: sufijo por tipo — `WorkOrderCreate`, `WorkOrderRead`, `WorkOrderUpdate`

### Frontend TypeScript
- Archivos/componentes: `PascalCase.tsx` para componentes, `camelCase.ts` para utils/hooks
- Variables/funciones: `camelCase`
- Tipos/interfaces: `PascalCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Hooks: prefijo `use` → `useWorkOrders`, `useAuth`
- Stores Zustand: sufijo `Store` → `authStore`, `uiStore`
- CSS classes: Tailwind utility classes

### API REST
- Rutas: `kebab-case`, plural (`/work-orders`, `/quote-items`)
- Query params: `snake_case` (`?branch_id=1&status=repairing`)
- JSON bodies/responses: `camelCase` (transformado automáticamente por FastAPI con `alias_generator`)
