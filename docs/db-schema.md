# TecnoSolution — Esquema de Base de Datos

Base de datos: **PostgreSQL 16**
Convenciones: nombres en `snake_case`, plural para tablas, FK sufijadas con `_id`, todos los timestamps en UTC.

---

## Diagrama de Relaciones (resumen)

```
companies (1) ──< branches (N)
companies (1) ──< subscriptions (N)
plans     (1) ──< subscriptions (N)
plans     (1) ──< plan_limits (1)
companies (1) ──< usage_counters (N)

users (N) >──< branches  [via user_branch_access]
roles (1) ──< user_branch_access (N)
branches (1) ──< customers (N)
customers (1) ──< devices (N)
branches (1) ──< work_orders (N)
customers (1) ──< work_orders (N)
devices (1) ──< work_orders (N)
work_orders (1) ──< work_order_status_history (N)
work_orders (1) ──< work_order_photos (N)
work_orders (1) ──< work_order_signatures (1)
work_orders (1) ──< work_order_items (N)
work_orders (1) ──< work_order_notes (N)
work_orders (1) ──< quotes (N)
quotes (1) ──< quote_items (N)
quotes (1) ──< quote_status_history (N)
branches (1) ──< products (N)
products (1) ──< stock_movements (N)
work_orders (1) ──< stock_movements (N) [nullable]
work_orders (1) ──< warranties (1)
warranties (1) ──< warranty_claims (N)
storage_objects (1) ──< work_order_photos (N)
storage_objects (1) ──< work_order_signatures (N)
storage_objects (1) ──< documents (N)
```

---

## Tenancy y Suscripciones

### `companies`
| Columna      | Tipo                  | Constraints              | Descripción                  |
|--------------|-----------------------|--------------------------|------------------------------|
| id           | SERIAL                | PK                       |                              |
| name         | VARCHAR(200)          | NOT NULL                 | Razón social / nombre        |
| slug         | VARCHAR(100)          | NOT NULL, UNIQUE         | Identificador URL-safe       |
| logo_url     | TEXT                  |                          | URL pública del logo         |
| is_active    | BOOLEAN               | NOT NULL, DEFAULT true   |                              |
| created_at   | TIMESTAMPTZ           | NOT NULL, DEFAULT now()  |                              |
| updated_at   | TIMESTAMPTZ           | NOT NULL, DEFAULT now()  |                              |

**Índices:** `idx_companies_slug` (slug), `idx_companies_is_active` (is_active)

---

### `branches`
| Columna      | Tipo                  | Constraints              | Descripción                  |
|--------------|-----------------------|--------------------------|------------------------------|
| id           | SERIAL                | PK                       |                              |
| company_id   | INTEGER               | NOT NULL, FK companies   |                              |
| name         | VARCHAR(200)          | NOT NULL                 |                              |
| address      | TEXT                  |                          |                              |
| phone        | VARCHAR(50)           |                          |                              |
| timezone     | VARCHAR(100)          | NOT NULL, DEFAULT 'UTC'  | eg. America/Argentina/Buenos_Aires |
| is_active    | BOOLEAN               | NOT NULL, DEFAULT true   |                              |
| created_at   | TIMESTAMPTZ           | NOT NULL, DEFAULT now()  |                              |

**Índices:** `idx_branches_company_id`

---

### `plans`
| Columna        | Tipo         | Constraints         | Descripción                      |
|----------------|--------------|---------------------|----------------------------------|
| id             | SERIAL       | PK                  |                                  |
| slug           | VARCHAR(50)  | NOT NULL, UNIQUE    | free \| professional \| enterprise |
| name           | VARCHAR(100) | NOT NULL            |                                  |
| price_monthly  | NUMERIC(10,2)| NOT NULL, DEFAULT 0 | En centavos (ARS)                |
| price_yearly   | NUMERIC(10,2)| NOT NULL, DEFAULT 0 |                                  |
| is_active      | BOOLEAN      | NOT NULL, DEFAULT true |                               |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT now() |                              |

---

### `plan_limits`
| Columna               | Tipo     | Constraints              | Descripción                          |
|-----------------------|----------|--------------------------|--------------------------------------|
| id                    | SERIAL   | PK                       |                                      |
| plan_id               | INTEGER  | NOT NULL, FK plans, UNIQUE |                                    |
| max_branches          | INTEGER  |                          | NULL = sin límite                    |
| max_users             | INTEGER  |                          | NULL = sin límite                    |
| max_orders_per_month  | INTEGER  |                          | NULL = sin límite                    |
| has_stock             | BOOLEAN  | NOT NULL, DEFAULT false  |                                      |
| has_warranties        | BOOLEAN  | NOT NULL, DEFAULT false  |                                      |
| has_advanced_email    | BOOLEAN  | NOT NULL, DEFAULT false  |                                      |
| has_reports           | BOOLEAN  | NOT NULL, DEFAULT false  |                                      |

---

### `subscriptions`
| Columna              | Tipo         | Constraints              | Descripción                       |
|----------------------|--------------|--------------------------|-----------------------------------|
| id                   | SERIAL       | PK                       |                                   |
| company_id           | INTEGER      | NOT NULL, FK companies   |                                   |
| plan_id              | INTEGER      | NOT NULL, FK plans       |                                   |
| status               | VARCHAR(20)  | NOT NULL                 | active \| trialing \| past_due \| cancelled |
| billing_cycle        | VARCHAR(10)  | NOT NULL, DEFAULT 'monthly' | monthly \| yearly              |
| current_period_start | TIMESTAMPTZ  | NOT NULL                 |                                   |
| current_period_end   | TIMESTAMPTZ  | NOT NULL                 |                                   |
| cancelled_at         | TIMESTAMPTZ  |                          |                                   |
| created_at           | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                   |

**Índices:** `idx_subscriptions_company_id`, `idx_subscriptions_status`

---

### `usage_counters`
| Columna        | Tipo         | Constraints              | Descripción                       |
|----------------|--------------|--------------------------|-----------------------------------|
| id             | SERIAL       | PK                       |                                   |
| company_id     | INTEGER      | NOT NULL, FK companies   |                                   |
| branch_id      | INTEGER      | FK branches              | NULL = counter a nivel company    |
| period         | CHAR(7)      | NOT NULL                 | Formato YYYY-MM                   |
| orders_count   | INTEGER      | NOT NULL, DEFAULT 0      |                                   |
| users_count    | INTEGER      | NOT NULL, DEFAULT 0      |                                   |
| updated_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                   |

**Constraint:** `uq_usage_counters_company_branch_period` (company_id, branch_id, period)

---

## Usuarios y Acceso

### `users`
| Columna          | Tipo         | Constraints              | Descripción                       |
|------------------|--------------|--------------------------|-----------------------------------|
| id               | SERIAL       | PK                       |                                   |
| email            | VARCHAR(255) | NOT NULL, UNIQUE         |                                   |
| hashed_password  | VARCHAR(255) | NOT NULL                 | bcrypt                            |
| full_name        | VARCHAR(200) | NOT NULL                 |                                   |
| phone            | VARCHAR(50)  |                          |                                   |
| is_active        | BOOLEAN      | NOT NULL, DEFAULT true   |                                   |
| is_superadmin    | BOOLEAN      | NOT NULL, DEFAULT false  |                                   |
| last_login_at    | TIMESTAMPTZ  |                          |                                   |
| created_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                   |
| updated_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                   |

**Índices:** `idx_users_email` (UNIQUE), `idx_users_is_active`

---

### `roles`
Tabla de lookup de roles del sistema. Permite extensión futura sin cambiar el esquema.

| Columna      | Tipo         | Constraints         | Descripción                                    |
|--------------|--------------|---------------------|------------------------------------------------|
| id           | SERIAL       | PK                  |                                                |
| slug         | VARCHAR(50)  | NOT NULL, UNIQUE    | superadmin \| admin_local \| tecnico           |
| display_name | VARCHAR(100) | NOT NULL            | Nombre legible para la UI                      |
| permissions  | JSONB        | NOT NULL, DEFAULT '{}' | Mapa de permisos: `{"orders:write": true, ...}` |
| is_system    | BOOLEAN      | NOT NULL, DEFAULT true | true = no se puede eliminar desde la UI     |
| created_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT now() |                                            |

**Índices:** `idx_roles_slug` (UNIQUE)

**Seed requerido:**
```sql
INSERT INTO roles (slug, display_name, permissions, is_system) VALUES
  ('superadmin', 'Super Administrador', '{"*": true}', true),
  ('admin_local', 'Administrador de Local', '{"orders:*": true, "customers:*": true, "users:invite": true, "stock:*": true, "reports:read": true}', true),
  ('tecnico', 'Técnico', '{"orders:read": true, "orders:write": true, "customers:read": true}', true);
```

---

### `user_branch_access`
| Columna    | Tipo        | Constraints                     | Descripción                          |
|------------|-------------|---------------------------------|--------------------------------------|
| id         | SERIAL      | PK                              |                                      |
| user_id    | INTEGER     | NOT NULL, FK users              |                                      |
| branch_id  | INTEGER     | NOT NULL, FK branches           |                                      |
| role_id    | INTEGER     | NOT NULL, FK roles              | Referencia a la tabla roles          |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now()         |                                      |

**Constraint:** `uq_user_branch_access` (user_id, branch_id)
**Índices:** `idx_user_branch_access_user_id`, `idx_user_branch_access_branch_id`, `idx_user_branch_access_role_id`

---

## Clientes y Dispositivos

### `customers`
| Columna    | Tipo         | Constraints              | Descripción                 |
|------------|--------------|--------------------------|-----------------------------|
| id         | SERIAL       | PK                       |                             |
| branch_id  | INTEGER      | NOT NULL, FK branches    |                             |
| full_name  | VARCHAR(200) | NOT NULL                 |                             |
| email      | VARCHAR(255) |                          |                             |
| phone      | VARCHAR(50)  |                          |                             |
| dni        | VARCHAR(20)  |                          | DNI / CUIT / pasaporte      |
| address    | TEXT         |                          |                             |
| notes      | TEXT         |                          | Notas internas del cliente  |
| created_at | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                             |
| updated_at | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                             |

**Índices:** `idx_customers_branch_id`, `idx_customers_email`, `idx_customers_phone`
**Búsqueda:** Índice GIN en columna generada con `to_tsvector('spanish', full_name || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(dni,''))`

---

### `devices`
| Columna        | Tipo         | Constraints              | Descripción                       |
|----------------|--------------|--------------------------|-----------------------------------|
| id             | SERIAL       | PK                       |                                   |
| customer_id    | INTEGER      | NOT NULL, FK customers   |                                   |
| device_type    | VARCHAR(20)  | NOT NULL                 | phone \| tablet \| laptop \| desktop \| other |
| brand          | VARCHAR(100) | NOT NULL                 |                                   |
| model          | VARCHAR(200) |                          |                                   |
| color          | VARCHAR(50)  |                          |                                   |
| serial_number  | VARCHAR(100) |                          |                                   |
| imei           | VARCHAR(20)  |                          |                                   |
| accessories    | TEXT         |                          | Lista de accesorios entregados    |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                   |

**Índices:** `idx_devices_customer_id`, `idx_devices_imei`, `idx_devices_serial_number`

---

## Órdenes de Trabajo

### `work_orders`
| Columna                 | Tipo          | Constraints                | Descripción                              |
|-------------------------|---------------|----------------------------|------------------------------------------|
| id                      | SERIAL        | PK                         |                                          |
| branch_id               | INTEGER       | NOT NULL, FK branches      |                                          |
| customer_id             | INTEGER       | NOT NULL, FK customers     |                                          |
| device_id               | INTEGER       | NOT NULL, FK devices       |                                          |
| order_number            | VARCHAR(30)   | NOT NULL, UNIQUE           | Formato: TS-YYYY-NNNNN                   |
| status                  | VARCHAR(50)   | NOT NULL, DEFAULT 'received' |                                        |
| assigned_tecnico_id     | INTEGER       | FK users                   |                                          |
| problem_description     | TEXT          | NOT NULL                   |                                          |
| diagnosis_notes         | TEXT          |                            |                                          |
| estimated_cost          | NUMERIC(12,2) |                            |                                          |
| final_cost              | NUMERIC(12,2) |                            |                                          |
| estimated_ready_date    | DATE          |                            |                                          |
| is_warranty_claim       | BOOLEAN       | NOT NULL, DEFAULT false    |                                          |
| original_order_id       | INTEGER       | FK work_orders             | Si es reclamo de garantía               |
| received_at             | TIMESTAMPTZ   | NOT NULL, DEFAULT now()    |                                          |
| delivered_at            | TIMESTAMPTZ   |                            |                                          |
| created_by_user_id      | INTEGER       | NOT NULL, FK users         |                                          |
| created_at              | TIMESTAMPTZ   | NOT NULL, DEFAULT now()    |                                          |
| updated_at              | TIMESTAMPTZ   | NOT NULL, DEFAULT now()    |                                          |

**Check:** `chk_work_orders_status` — status IN ('received','queued','diagnosing','waiting_customer_approval','quote_sent','approved','rejected','waiting_parts','repairing','repaired','ready_for_pickup','delivered','warranty','cancelled')

**Índices:** `idx_work_orders_branch_id`, `idx_work_orders_customer_id`, `idx_work_orders_status`, `idx_work_orders_order_number` (UNIQUE), `idx_work_orders_assigned_tecnico_id`, `idx_work_orders_received_at`

---

### `work_order_status_history`
| Columna            | Tipo         | Constraints              | Descripción             |
|--------------------|--------------|--------------------------|-------------------------|
| id                 | SERIAL       | PK                       |                         |
| work_order_id      | INTEGER      | NOT NULL, FK work_orders |                         |
| from_status        | VARCHAR(50)  |                          | NULL si es estado inicial |
| to_status          | VARCHAR(50)  | NOT NULL                 |                         |
| changed_by_user_id | INTEGER      | NOT NULL, FK users       |                         |
| note               | TEXT         |                          |                         |
| changed_at         | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                         |

**Índices:** `idx_wo_status_history_work_order_id`

---

### `work_order_photos`
| Columna             | Tipo        | Constraints                    | Descripción                    |
|---------------------|-------------|--------------------------------|--------------------------------|
| id                  | SERIAL      | PK                             |                                |
| work_order_id       | INTEGER     | NOT NULL, FK work_orders       |                                |
| storage_object_id   | INTEGER     | NOT NULL, FK storage_objects   |                                |
| visible_to_customer | BOOLEAN     | NOT NULL, DEFAULT false        |                                |
| taken_at            | TIMESTAMPTZ | NOT NULL, DEFAULT now()        |                                |

**Índices:** `idx_work_order_photos_work_order_id`

---

### `work_order_signatures`
| Columna           | Tipo        | Constraints                    | Descripción                      |
|-------------------|-------------|--------------------------------|----------------------------------|
| id                | SERIAL      | PK                             |                                  |
| work_order_id     | INTEGER     | NOT NULL, FK work_orders, UNIQUE |                                |
| storage_object_id | INTEGER     | NOT NULL, FK storage_objects   |                                  |
| signed_at         | TIMESTAMPTZ | NOT NULL, DEFAULT now()        |                                  |

---

### `work_order_items`
| Columna        | Tipo          | Constraints              | Descripción                    |
|----------------|---------------|--------------------------|--------------------------------|
| id             | SERIAL        | PK                       |                                |
| work_order_id  | INTEGER       | NOT NULL, FK work_orders |                                |
| product_id     | INTEGER       | FK products              | NULL si ítem manual            |
| description    | VARCHAR(500)  | NOT NULL                 |                                |
| quantity       | NUMERIC(10,3) | NOT NULL, DEFAULT 1      |                                |
| unit_price     | NUMERIC(12,2) | NOT NULL                 |                                |
| total_price    | NUMERIC(12,2) | NOT NULL (qty * unit_price) |                               |

**Índices:** `idx_work_order_items_work_order_id`

---

### `work_order_notes`
| Columna        | Tipo        | Constraints              | Descripción                         |
|----------------|-------------|--------------------------|-------------------------------------|
| id             | SERIAL      | PK                       |                                     |
| work_order_id  | INTEGER     | NOT NULL, FK work_orders |                                     |
| user_id        | INTEGER     | NOT NULL, FK users       |                                     |
| content        | TEXT        | NOT NULL                 |                                     |
| is_internal    | BOOLEAN     | NOT NULL, DEFAULT true   | false = visible al cliente (futuro) |
| created_at     | TIMESTAMPTZ | NOT NULL, DEFAULT now()  |                                     |

**Índices:** `idx_work_order_notes_work_order_id`

---

## Presupuestos

### `quotes`
| Columna             | Tipo          | Constraints              | Descripción                       |
|---------------------|---------------|--------------------------|-----------------------------------|
| id                  | SERIAL        | PK                       |                                   |
| work_order_id       | INTEGER       | NOT NULL, FK work_orders |                                   |
| status              | VARCHAR(20)   | NOT NULL, DEFAULT 'draft'| draft \| sent \| approved \| rejected \| expired |
| total               | NUMERIC(12,2) | NOT NULL                 |                                   |
| valid_until         | DATE          |                          |                                   |
| notes               | TEXT          |                          |                                   |
| created_by_user_id  | INTEGER       | NOT NULL, FK users       |                                   |
| created_at          | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |                                   |
| updated_at          | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |                                   |

**Índices:** `idx_quotes_work_order_id`, `idx_quotes_status`

---

### `quote_items`
| Columna      | Tipo          | Constraints        | Descripción   |
|--------------|---------------|--------------------|---------------|
| id           | SERIAL        | PK                 |               |
| quote_id     | INTEGER       | NOT NULL, FK quotes |              |
| description  | VARCHAR(500)  | NOT NULL           |               |
| quantity     | NUMERIC(10,3) | NOT NULL, DEFAULT 1 |              |
| unit_price   | NUMERIC(12,2) | NOT NULL           |               |
| total_price  | NUMERIC(12,2) | NOT NULL           |               |

**Índices:** `idx_quote_items_quote_id`

---

### `quote_status_history`
| Columna       | Tipo         | Constraints         | Descripción             |
|---------------|--------------|---------------------|-------------------------|
| id            | SERIAL       | PK                  |                         |
| quote_id      | INTEGER      | NOT NULL, FK quotes |                         |
| from_status   | VARCHAR(20)  |                     |                         |
| to_status     | VARCHAR(20)  | NOT NULL            |                         |
| note          | TEXT         |                     |                         |
| changed_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT now() |                     |

---

## Stock

### `products`
| Columna         | Tipo          | Constraints              | Descripción                        |
|-----------------|---------------|--------------------------|------------------------------------|
| id              | SERIAL        | PK                       |                                    |
| branch_id       | INTEGER       | NOT NULL, FK branches    |                                    |
| sku             | VARCHAR(100)  |                          |                                    |
| name            | VARCHAR(300)  | NOT NULL                 |                                    |
| description     | TEXT          |                          |                                    |
| unit_cost       | NUMERIC(12,2) | NOT NULL, DEFAULT 0      |                                    |
| stock_qty       | NUMERIC(10,3) | NOT NULL, DEFAULT 0      |                                    |
| min_stock_alert | NUMERIC(10,3) | NOT NULL, DEFAULT 0      | Alerta cuando stock_qty < este valor |
| is_active       | BOOLEAN       | NOT NULL, DEFAULT true   |                                    |
| created_at      | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |                                    |
| updated_at      | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |                                    |

**Constraint:** `uq_products_branch_sku` (branch_id, sku) WHERE sku IS NOT NULL
**Índices:** `idx_products_branch_id`, `idx_products_is_active`

---

### `stock_movements`
| Columna             | Tipo          | Constraints              | Descripción                        |
|---------------------|---------------|--------------------------|------------------------------------|
| id                  | SERIAL        | PK                       |                                    |
| product_id          | INTEGER       | NOT NULL, FK products    |                                    |
| work_order_id       | INTEGER       | FK work_orders           | NULL si es movimiento manual       |
| movement_type       | VARCHAR(20)   | NOT NULL                 | in \| out \| adjustment            |
| qty                 | NUMERIC(10,3) | NOT NULL                 |                                    |
| stock_after         | NUMERIC(10,3) | NOT NULL                 | Snapshot del stock luego del movimiento |
| note                | TEXT          |                          |                                    |
| created_by_user_id  | INTEGER       | NOT NULL, FK users       |                                    |
| created_at          | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |                                    |

**Índices:** `idx_stock_movements_product_id`, `idx_stock_movements_work_order_id`, `idx_stock_movements_created_at`

---

## Garantías

### `warranties`
| Columna        | Tipo        | Constraints                    | Descripción             |
|----------------|-------------|--------------------------------|-------------------------|
| id             | SERIAL      | PK                             |                         |
| work_order_id  | INTEGER     | NOT NULL, FK work_orders, UNIQUE |                       |
| duration_days  | INTEGER     | NOT NULL                       |                         |
| starts_at      | DATE        | NOT NULL                       |                         |
| expires_at     | DATE        | NOT NULL                       |                         |
| terms          | TEXT        |                                | Condiciones de garantía |
| created_at     | TIMESTAMPTZ | NOT NULL, DEFAULT now()        |                         |

**Índices:** `idx_warranties_work_order_id`, `idx_warranties_expires_at`

---

### `warranty_claims`
| Columna           | Tipo        | Constraints              | Descripción                           |
|-------------------|-------------|--------------------------|---------------------------------------|
| id                | SERIAL      | PK                       |                                       |
| warranty_id       | INTEGER     | NOT NULL, FK warranties  |                                       |
| new_work_order_id | INTEGER     | FK work_orders           | Nueva orden creada para el reclamo    |
| description       | TEXT        | NOT NULL                 |                                       |
| claimed_at        | TIMESTAMPTZ | NOT NULL, DEFAULT now()  |                                       |

---

## Documentos y Storage

### `storage_objects`
| Columna              | Tipo         | Constraints              | Descripción                            |
|----------------------|--------------|--------------------------|----------------------------------------|
| id                   | SERIAL       | PK                       |                                        |
| bucket               | VARCHAR(100) | NOT NULL                 | Nombre del bucket MinIO                |
| object_key           | TEXT         | NOT NULL                 | Path dentro del bucket                 |
| original_filename    | VARCHAR(500) |                          |                                        |
| mime_type            | VARCHAR(100) |                          |                                        |
| size_bytes           | BIGINT       |                          |                                        |
| uploaded_by_user_id  | INTEGER      | FK users                 |                                        |
| uploaded_at          | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                        |

**Constraint:** `uq_storage_objects_bucket_key` (bucket, object_key)

---

### `documents`
| Columna           | Tipo         | Constraints              | Descripción                           |
|-------------------|--------------|--------------------------|---------------------------------------|
| id                | SERIAL       | PK                       |                                       |
| branch_id         | INTEGER      | NOT NULL, FK branches    |                                       |
| work_order_id     | INTEGER      | FK work_orders           |                                       |
| doc_type          | VARCHAR(30)  | NOT NULL                 | invoice \| receipt \| quote_pdf \| report |
| storage_object_id | INTEGER      | NOT NULL, FK storage_objects |                                   |
| created_at        | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                       |

**Índices:** `idx_documents_work_order_id`, `idx_documents_branch_id`

---

## Notificaciones y Email

### `email_events`
| Columna       | Tipo         | Constraints              | Descripción                           |
|---------------|--------------|--------------------------|---------------------------------------|
| id            | SERIAL       | PK                       |                                       |
| to_email      | VARCHAR(255) | NOT NULL                 |                                       |
| subject       | VARCHAR(500) | NOT NULL                 |                                       |
| template      | VARCHAR(100) | NOT NULL                 | eg. order_received, quote_ready       |
| payload       | JSONB        |                          | Variables del template                |
| status        | VARCHAR(20)  | NOT NULL, DEFAULT 'queued' | queued \| sent \| failed            |
| resend_id     | VARCHAR(100) |                          | ID de Resend para trazabilidad        |
| sent_at       | TIMESTAMPTZ  |                          |                                       |
| error_message | TEXT         |                          |                                       |
| created_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                       |

**Índices:** `idx_email_events_status`, `idx_email_events_created_at`

---

### `notification_logs`
| Columna        | Tipo         | Constraints              | Descripción                           |
|----------------|--------------|--------------------------|---------------------------------------|
| id             | SERIAL       | PK                       |                                       |
| user_id        | INTEGER      | NOT NULL, FK users       |                                       |
| work_order_id  | INTEGER      | FK work_orders           |                                       |
| type           | VARCHAR(50)  | NOT NULL                 | eg. status_change, new_note, quote_sent |
| message        | TEXT         | NOT NULL                 |                                       |
| read_at        | TIMESTAMPTZ  |                          | NULL = no leída                       |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT now()  |                                       |

**Índices:** `idx_notification_logs_user_id`, `idx_notification_logs_read_at`

---

## Seed Data Requerido

```sql
-- Roles base (el seed de roles está en la sección user_branch_access arriba)
-- Aquí se incluye como referencia completa del orden de inserción:

-- 1. Roles
INSERT INTO roles (slug, display_name, permissions, is_system) VALUES
  ('superadmin', 'Super Administrador', '{"*": true}', true),
  ('admin_local', 'Administrador de Local', '{"orders:*": true, "customers:*": true, "users:invite": true, "stock:*": true, "reports:read": true}', true),
  ('tecnico', 'Técnico', '{"orders:read": true, "orders:write": true, "customers:read": true}', true);

-- 2. Planes base
INSERT INTO plans (slug, name, price_monthly, price_yearly) VALUES
  ('free', 'Gratuito', 0, 0),
  ('professional', 'Profesional', 9900, 99000),
  ('enterprise', 'Enterprise', 29900, 299000);

-- Límites por plan
INSERT INTO plan_limits (plan_id, max_branches, max_users, max_orders_per_month, has_stock, has_warranties, has_advanced_email, has_reports)
VALUES
  (1, 1, 2, 10, false, false, false, false),      -- free
  (2, 1, 10, NULL, true, true, false, true),       -- professional
  (3, NULL, NULL, NULL, true, true, true, true);   -- enterprise
```
