# TecnoSolution — Contratos de API

Todos los endpoints están bajo el prefijo `/api`. Las respuestas usan `camelCase`. Los cuerpos de request usan `camelCase`.

**Auth requerida:** Bearer token JWT en header `Authorization: Bearer <token>` excepto donde se indique `public`.

**Errores comunes:**
- `401 Unauthorized` — token ausente o inválido
- `403 Forbidden` — rol insuficiente o feature no incluida en el plan
- `402 Payment Required` — límite del plan alcanzado
- `404 Not Found` — recurso no existe o no pertenece al branch
- `422 Unprocessable Entity` — error de validación

---

## Auth

### POST /api/auth/login
Autentica un usuario y retorna tokens.

**Auth:** `public`

**Request:**
```json
{
  "email": "admin@taller.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "bearer",
  "user": {
    "id": 1,
    "email": "admin@taller.com",
    "fullName": "Juan Pérez",
    "role": "admin_local",
    "branchIds": [1, 2],
    "companyId": 1
  }
}
```
El refresh token se entrega como `httpOnly` cookie `refresh_token`.

---

### POST /api/auth/logout
Invalida el refresh token actual.

**Auth:** `required`

**Response `204`:** Sin cuerpo.

---

### POST /api/auth/refresh
Emite un nuevo access token usando el refresh token de la cookie.

**Auth:** `public` (usa cookie `refresh_token`)

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "bearer"
}
```

---

### GET /api/auth/me
Retorna el usuario autenticado con sus permisos.

**Auth:** `required`

**Response `200`:**
```json
{
  "id": 1,
  "email": "admin@taller.com",
  "fullName": "Juan Pérez",
  "role": "admin_local",
  "isActive": true,
  "branchIds": [1],
  "companyId": 1,
  "plan": "professional"
}
```

---

## Companies & Branches

### POST /api/companies
Crea una nueva empresa (solo superadmin).

**Auth:** `superadmin`

**Request:**
```json
{
  "name": "Taller Tech S.R.L.",
  "slug": "taller-tech",
  "planId": 2
}
```

**Response `201`:**
```json
{
  "id": 1,
  "name": "Taller Tech S.R.L.",
  "slug": "taller-tech",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### GET /api/companies/{id}
Retorna datos de la empresa.

**Auth:** `superadmin` o miembro de la company

**Response `200`:**
```json
{
  "id": 1,
  "name": "Taller Tech S.R.L.",
  "slug": "taller-tech",
  "logoUrl": null,
  "plan": {
    "slug": "professional",
    "name": "Profesional"
  },
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "2026-04-01T00:00:00Z"
  },
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### POST /api/companies/{id}/branches
Crea un nuevo local dentro de la empresa.

**Auth:** `superadmin` o `admin_local` (con límite de plan)

**Request:**
```json
{
  "name": "Sucursal Centro",
  "address": "Av. San Martín 123, Córdoba",
  "phone": "+54 351 123-4567",
  "timezone": "America/Argentina/Cordoba"
}
```

**Response `201`:**
```json
{
  "id": 2,
  "companyId": 1,
  "name": "Sucursal Centro",
  "address": "Av. San Martín 123, Córdoba",
  "phone": "+54 351 123-4567",
  "timezone": "America/Argentina/Cordoba",
  "isActive": true
}
```

---

### GET /api/companies/{id}/branches
Lista los locales de la empresa.

**Auth:** `required` (miembro de la company)

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Local Principal",
    "address": "Rivadavia 500",
    "isActive": true
  },
  {
    "id": 2,
    "name": "Sucursal Centro",
    "address": "Av. San Martín 123",
    "isActive": true
  }
]
```

---

## Users

### GET /api/users
Lista usuarios. Filtrado automático por branch del solicitante.

**Auth:** `admin_local` o `superadmin`

**Query params:**
- `branchId` (int, opcional) — filtrar por branch específico
- `role` (string, opcional) — `admin_local` | `tecnico`

**Response `200`:**
```json
{
  "data": [
    {
      "id": 3,
      "email": "tecnico@taller.com",
      "fullName": "María García",
      "role": "tecnico",
      "branchId": 1,
      "isActive": true
    }
  ],
  "total": 1
}
```

---

### POST /api/users/invite
Invita a un usuario enviando email con link de registro.

**Auth:** `admin_local` o `superadmin`

**Request:**
```json
{
  "email": "nuevo@taller.com",
  "role": "tecnico",
  "branchId": 1
}
```

**Response `201`:**
```json
{
  "message": "Invitation sent to nuevo@taller.com"
}
```

---

### PUT /api/users/{id}/role
Cambia el rol de un usuario dentro de un branch.

**Auth:** `admin_local` o `superadmin`

**Request:**
```json
{
  "role": "admin_local",
  "branchId": 1
}
```

**Response `200`:**
```json
{
  "id": 3,
  "email": "tecnico@taller.com",
  "role": "admin_local",
  "branchId": 1
}
```

---

## Customers

### GET /api/customers
Busca clientes del branch. Soporta búsqueda full-text.

**Auth:** `required`

**Query params:**
- `q` (string) — busca en nombre, email, teléfono, DNI
- `page` (int, default 1)
- `pageSize` (int, default 20)

**Response `200`:**
```json
{
  "data": [
    {
      "id": 5,
      "fullName": "Carlos López",
      "email": "carlos@mail.com",
      "phone": "+54 11 1234-5678",
      "totalOrders": 3
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /api/customers
Crea un nuevo cliente.

**Auth:** `required`

**Request:**
```json
{
  "fullName": "Carlos López",
  "email": "carlos@mail.com",
  "phone": "+54 11 1234-5678",
  "dni": "28123456",
  "address": "Belgrano 200, CABA"
}
```

**Response `201`:** Objeto customer completo.

---

### GET /api/customers/{id}
Retorna cliente con historial de órdenes.

**Auth:** `required`

**Response `200`:**
```json
{
  "id": 5,
  "fullName": "Carlos López",
  "email": "carlos@mail.com",
  "phone": "+54 11 1234-5678",
  "dni": "28123456",
  "address": "Belgrano 200, CABA",
  "createdAt": "2026-01-15T09:00:00Z",
  "devices": [
    {
      "id": 3,
      "brand": "Samsung",
      "model": "Galaxy S22",
      "deviceType": "phone",
      "imei": "352999111234567"
    }
  ],
  "recentOrders": [
    {
      "id": 10,
      "orderNumber": "TS-2026-00010",
      "status": "ready_for_pickup",
      "receivedAt": "2026-03-15T10:30:00Z"
    }
  ]
}
```

---

## Work Orders

### GET /api/work-orders
Lista órdenes del branch con filtros.

**Auth:** `required`

**Query params:**
- `branchId` (int)
- `status` (string) — ver estados válidos
- `assignedTo` (int) — userId del técnico
- `dateFrom` / `dateTo` (ISO 8601)
- `q` (string) — búsqueda por número de orden o nombre de cliente
- `page` (int, default 1)
- `pageSize` (int, default 20)

**Response `200`:**
```json
{
  "data": [
    {
      "id": 10,
      "orderNumber": "TS-2026-00010",
      "status": "repairing",
      "customer": { "id": 5, "fullName": "Carlos López" },
      "device": { "brand": "Samsung", "model": "Galaxy S22" },
      "assignedTecnico": { "id": 3, "fullName": "María García" },
      "estimatedReadyDate": "2026-03-20",
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /api/work-orders
Crea una nueva orden de trabajo.

**Auth:** `required` (respeta límite de plan)

**Request:**
```json
{
  "branchId": 1,
  "customerId": 5,
  "device": {
    "brand": "Samsung",
    "model": "Galaxy S22",
    "deviceType": "phone",
    "imei": "352999111234567",
    "color": "Negro",
    "accessories": "Cargador, funda"
  },
  "problemDescription": "Pantalla rota, no enciende",
  "assignedTecnicoId": 3,
  "estimatedReadyDate": "2026-03-20"
}
```

**Response `201`:** Objeto work order completo incluyendo `orderNumber`.

---

### GET /api/work-orders/{id}
Retorna la orden completa con historial, fotos, notas e ítems.

**Auth:** `required`

**Response `200`:**
```json
{
  "id": 10,
  "orderNumber": "TS-2026-00010",
  "status": "repairing",
  "branchId": 1,
  "customer": { "id": 5, "fullName": "Carlos López", "phone": "+54 11 1234-5678" },
  "device": {
    "id": 3,
    "brand": "Samsung",
    "model": "Galaxy S22",
    "imei": "352999111234567"
  },
  "problemDescription": "Pantalla rota, no enciende",
  "diagnosisNotes": "Display roto, batería ok",
  "estimatedCost": 15000.00,
  "finalCost": null,
  "estimatedReadyDate": "2026-03-20",
  "assignedTecnico": { "id": 3, "fullName": "María García" },
  "items": [],
  "photos": [],
  "notes": [],
  "activeQuote": null,
  "receivedAt": "2026-03-15T10:30:00Z",
  "updatedAt": "2026-03-16T08:00:00Z"
}
```

---

### PATCH /api/work-orders/{id}/status
Cambia el estado de la orden.

**Auth:** `required`

**Request:**
```json
{
  "status": "repaired",
  "note": "Pantalla reemplazada exitosamente"
}
```

**Response `200`:** Objeto work order actualizado.

**Validación:** Se controlan las transiciones permitidas. No se puede pasar de `cancelled` a cualquier estado.

---

### GET /api/work-orders/{id}/history
Retorna el historial completo de cambios de estado.

**Auth:** `required`

**Response `200`:**
```json
[
  {
    "id": 1,
    "fromStatus": "received",
    "toStatus": "diagnosing",
    "changedBy": { "id": 3, "fullName": "María García" },
    "note": "Iniciado diagnóstico",
    "changedAt": "2026-03-15T11:00:00Z"
  }
]
```

---

### POST /api/work-orders/{id}/photos
Solicita una URL pre-firmada para subir una foto.

**Auth:** `required`

**Request:**
```json
{
  "filename": "pantalla-rota.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2048000,
  "visibleToCustomer": true
}
```

**Response `201`:**
```json
{
  "uploadUrl": "https://minio.example.com/work-order-photos/...?X-Amz-Signature=...",
  "objectKey": "1/10/1710000000_uuid.jpg",
  "expiresIn": 900
}
```
El frontend debe confirmar el upload con `POST /api/work-orders/{id}/photos/{objectKey}/confirm`.

---

### POST /api/work-orders/{id}/signature
Sube la firma digital del cliente al entregar el equipo.

**Auth:** `required`

**Request:** `multipart/form-data` con campo `signature` (imagen PNG).

**Response `201`:**
```json
{
  "id": 1,
  "objectKey": "1/10/signature.png",
  "signedAt": "2026-03-20T15:00:00Z"
}
```

---

## Quotes

### POST /api/work-orders/{id}/quotes
Crea un presupuesto para la orden.

**Auth:** `required`

**Request:**
```json
{
  "items": [
    { "description": "Display Samsung S22 original", "quantity": 1, "unitPrice": 12000 },
    { "description": "Mano de obra", "quantity": 1, "unitPrice": 3000 }
  ],
  "validUntil": "2026-03-25"
}
```

**Response `201`:**
```json
{
  "id": 5,
  "workOrderId": 10,
  "status": "draft",
  "total": 15000.00,
  "items": [ ... ],
  "validUntil": "2026-03-25",
  "createdAt": "2026-03-16T09:00:00Z"
}
```

---

### PATCH /api/quotes/{id}/status
Cambia el estado del presupuesto (enviar, aprobar, rechazar).

**Auth:** `required`

**Request:**
```json
{
  "status": "sent",
  "note": "Enviado por WhatsApp"
}
```

**Response `200`:** Objeto quote actualizado.

**Estados válidos:** `draft → sent → approved | rejected | expired`

---

## Public

### GET /api/public/order/{order_number}
Consulta pública del estado de una orden. Sin autenticación.

**Auth:** `public`

**Response `200`:**
```json
{
  "orderNumber": "TS-2026-00010",
  "status": "ready_for_pickup",
  "statusLabel": "Listo para retirar",
  "device": "Samsung Galaxy S22",
  "estimatedReadyDate": "2026-03-20",
  "branch": {
    "name": "Local Principal",
    "phone": "+54 351 123-4567",
    "address": "Rivadavia 500"
  },
  "photos": [
    {
      "url": "https://minio.example.com/...",
      "takenAt": "2026-03-16T10:00:00Z"
    }
  ],
  "lastUpdatedAt": "2026-03-20T08:00:00Z"
}
```

**Response `404`:** Si el número de orden no existe.

---

## Stock

### GET /api/products
Lista productos/piezas del branch.

**Auth:** `required` (plan Profesional o Enterprise)

**Query params:**
- `q` (string) — búsqueda por nombre o SKU
- `lowStock` (bool) — solo productos bajo mínimo
- `page`, `pageSize`

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "sku": "DISP-SAM-S22",
      "name": "Display Samsung S22 Original",
      "unitCost": 12000.00,
      "stockQty": 3,
      "minStockAlert": 2,
      "isActive": true
    }
  ],
  "total": 1
}
```

---

### POST /api/products
Crea un nuevo producto en el stock.

**Auth:** `admin_local` o `superadmin` (plan Profesional o Enterprise)

**Request:**
```json
{
  "sku": "DISP-SAM-S22",
  "name": "Display Samsung S22 Original",
  "description": "Display OLED original con marco",
  "unitCost": 12000.00,
  "stockQty": 5,
  "minStockAlert": 2
}
```

**Response `201`:** Objeto product completo.

---

### POST /api/stock/movements
Registra un movimiento de stock (entrada, salida, ajuste).

**Auth:** `admin_local` o `superadmin`

**Request:**
```json
{
  "productId": 1,
  "movementType": "out",
  "qty": 1,
  "workOrderId": 10,
  "note": "Usado en reparación orden TS-2026-00010"
}
```

**Response `201`:**
```json
{
  "id": 15,
  "productId": 1,
  "movementType": "out",
  "qty": 1,
  "stockAfter": 2,
  "workOrderId": 10,
  "createdAt": "2026-03-16T11:00:00Z"
}
```

---

## Plans & Subscriptions

### GET /api/plans
Lista todos los planes disponibles.

**Auth:** `public`

**Response `200`:**
```json
[
  {
    "id": 1,
    "slug": "free",
    "name": "Gratuito",
    "priceMonthly": 0,
    "priceYearly": 0,
    "limits": {
      "maxBranches": 1,
      "maxUsers": 2,
      "maxOrdersPerMonth": 10,
      "hasStock": false,
      "hasWarranties": false,
      "hasAdvancedEmail": false
    }
  },
  {
    "id": 2,
    "slug": "professional",
    "name": "Profesional",
    "priceMonthly": 9900,
    "priceYearly": 99000,
    "limits": {
      "maxBranches": 1,
      "maxUsers": 10,
      "maxOrdersPerMonth": null,
      "hasStock": true,
      "hasWarranties": true,
      "hasAdvancedEmail": false
    }
  }
]
```

---

### POST /api/subscriptions
Crea o actualiza la suscripción de una empresa.

**Auth:** `superadmin`

**Request:**
```json
{
  "companyId": 1,
  "planId": 2,
  "billingCycle": "monthly"
}
```

**Response `201`:**
```json
{
  "id": 1,
  "companyId": 1,
  "plan": { "slug": "professional", "name": "Profesional" },
  "status": "active",
  "currentPeriodStart": "2026-03-01T00:00:00Z",
  "currentPeriodEnd": "2026-04-01T00:00:00Z"
}
```

---

### GET /api/subscriptions/current
Retorna la suscripción activa de la empresa del usuario autenticado.

**Auth:** `required`

**Response `200`:** Objeto subscription con plan y uso actual del período.

```json
{
  "id": 1,
  "plan": { "slug": "professional", "name": "Profesional" },
  "status": "active",
  "currentPeriodEnd": "2026-04-01T00:00:00Z",
  "usage": {
    "ordersThisMonth": 47,
    "maxOrdersPerMonth": null,
    "usersCount": 4,
    "maxUsers": 10,
    "branchesCount": 1,
    "maxBranches": 1
  }
}
```
