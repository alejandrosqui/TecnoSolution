.PHONY: up down logs db-shell migrate migrate-create backend-shell install-backend test-backend

COMPOSE := docker compose
COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

## ─── Infrastructure ─────────────────────────────────────────────────────────

up:
	$(COMPOSE) up -d

up-dev:
	$(COMPOSE_DEV) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

## ─── Database ────────────────────────────────────────────────────────────────

db-shell:
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-tecnosolution} -d $${POSTGRES_DB:-tecnosolution_db}

migrate:
	$(COMPOSE) exec backend alembic upgrade head

migrate-create:
	$(COMPOSE) exec backend alembic revision --autogenerate -m "$(name)"

## ─── Backend ─────────────────────────────────────────────────────────────────

backend-shell:
	$(COMPOSE) exec backend bash

install-backend:
	$(COMPOSE) exec backend pip install -r requirements.txt

test-backend:
	$(COMPOSE) exec backend pytest -v
