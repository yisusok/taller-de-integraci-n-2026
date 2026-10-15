# E-Commerce - Taller de Integración 2026

Plataforma de comercio electrónico desarrollada con **NestJS**, **React** y **PostgreSQL**.

---

## 📁 Estructura del Proyecto

```text
taller-de-integraci-n-2026/
├── backend/                   # API REST con NestJS y TypeScript
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts      # Conexión TypeORM con PostgreSQL local
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                  # Aplicación SPA con React, Vite y TypeScript
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── assets/
│   ├── package.json
│   └── vite.config.ts
├── documentacion/             # Documentación del proyecto
│   ├── DR/                    # Architecture Decision Records (ADRs)
│   │   ├── README.md          # ¿Qué son los Decision Records y plantilla estándar?
│   │   └── ADR-001-stack-tecnologico.md # Decisión del stack NestJS + React + PostgreSQL
│   ├── diagramas/             # Diagramas arquitectónicos y modelos de datos
│   │   └── README.md          # Diagrama C4 Contenedores y Modelo ER
│   └── README.md              # Índice general de documentación
├── .env.example               # Plantilla de variables de entorno
└── .gitignore                 # Exclusiones de Git
```

---

## 🚀 Requisitos Previos

* **Node.js**: v18+ o superior (ejecutar `node -v` para comprobar)
* **PostgreSQL instalado localmente** (ej. servicio nativo de Windows, pgAdmin o instancia cloud de PostgreSQL)
* **npm** o gestor de paquetes de Node

---

## 🛠️ Puesta en Marcha

### 1. Variables de Entorno
Copia el archivo `.env.example` a `.env` en la raíz (o en `backend/.env`) y ajusta las credenciales de tu PostgreSQL local:
```bash
cp .env.example .env
```
Contenido por defecto:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_local
DB_NAME=ecommerce_db
```

### 2. Base de Datos (PostgreSQL Local)
Asegúrate de que tu servicio PostgreSQL esté corriendo y crea la base de datos (mediante psql o pgAdmin):
```sql
CREATE DATABASE ecommerce_db;
```

### 3. Iniciar el Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
El servidor backend se ejecutará en: `http://localhost:3000`

### 4. Iniciar el Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
La aplicación cliente se ejecutará en: `http://localhost:5173`

---

## 📚 Documentación y Decision Records

* Consulta la [Guía de Decision Records](./documentacion/DR/README.md) para conocer cómo documentamos decisiones técnicas.
* Consulta los [Diagramas del Sistema](./documentacion/diagramas/README.md) para entender la arquitectura y el modelo de datos.
