# E-Commerce — Taller de Integración 2026

Plataforma de comercio electrónico con **NestJS**, **React** y **PostgreSQL**.

---

## Estructura del Proyecto

```text
taller-de-integraci-n-2026/
├── backend/                        # API REST (NestJS + TypeScript)
│   └── src/
│       ├── app.controller.ts       # GET /api/health
│       ├── app.module.ts           # Módulo raíz (TypeORM, Config, Auth)
│       ├── main.ts                 # Bootstrap — prefijo global /api, CORS, ValidationPipe
│       ├── auth/
│       │   ├── auth.controller.ts  # POST /api/auth/register
│       │   ├── auth.service.ts     # Lógica de registro y búsqueda de usuarios
│       │   ├── auth.module.ts
│       │   └── dto/
│       │       └── register.dto.ts # Validación y transformación de entrada
│       └── users/
│           └── entities/
│               └── user.entity.ts  # Entidad User (preparada para Auth0)
│
├── frontend/                       # SPA (React 19 + TypeScript + Vite)
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── components/
│           └── RegisterForm.tsx
│
├── documentacion/
│   ├── DR/                         # Architecture Decision Records
│   └── diagramas/                  # Diagramas C4 y ER
│
├── .env.example                    # Variables de entorno (incluye Auth0)
└── .gitignore
```

---

## Endpoints del Backend

| Método | Ruta                  | Descripción                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/health`         | Health check del servidor            |
| POST   | `/api/auth/register`  | Registro de usuario (local / bcrypt) |

> **Próximamente:** `POST /api/auth/login` y guards JWT de Auth0.

---

## Entidad `User`

La tabla `users` ya está preparada para Auth0:

| Campo           | Tipo        | Descripción                                      |
|-----------------|-------------|--------------------------------------------------|
| `id`            | `uuid`      | PK generada automáticamente                      |
| `nombre`        | `varchar`   | Nombre del usuario                               |
| `email`         | `varchar`   | Email único, no actualizable                     |
| `password_hash` | `varchar?`  | Nulo para usuarios de Auth0                      |
| `authProvider`  | `varchar`   | `'local'` o `'auth0'`                           |
| `providerId`    | `varchar?`  | Sub de Auth0 (`auth0|64f...`) para usuarios SSO  |
| `rol`           | `enum`      | `cliente`, `admin_ventas`, `soporte`             |
| `createdAt`     | `timestamp` | —                                                |
| `updatedAt`     | `timestamp` | —                                                |

---

## Variables de Entorno

Copia `.env.example` a `.env` en la carpeta `backend/` y completa los valores:

```bash
cp .env.example backend/.env
```

Las variables de Auth0 (`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, etc.) se usarán en la próxima fase de integración.

---

## Puesta en Marcha

### 1. Base de Datos

Asegurate de tener PostgreSQL corriendo y crear la base:

```sql
CREATE DATABASE ecommerce_db;
```

### 2. Backend (NestJS — puerto 3000)

```bash
cd backend
npm install
npm run start:dev
```

Verificar: `GET http://localhost:3000/api/health`

### 3. Frontend (React — puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

---

## Tests

```bash
cd backend
npm test
```

---

## Documentación

- [Architecture Decision Records](./documentacion/DR/README.md)
- [Diagramas del Sistema](./documentacion/diagramas/README.md)
