# Diagramas del Sistema

Esta carpeta contiene los diagramas arquitectónicos, modelos de datos y flujos de negocio del proyecto de **E-commerce**.

---

## 1. Diagrama de Arquitectura General (C4 - Nivel 2: Contenedores)

```mermaid
graph TD
    Client["Cliente / Usuario Web\n(Navegador)"]
    Frontend["Frontend App\n[React + TypeScript + Vite]\nPuerto 5173"]
    Backend["Backend API REST\n[NestJS + TypeScript]\nPuerto 3000"]
    Database[("Base de Datos\n[PostgreSQL]\nPuerto 5432")]

    Client -->|HTTPS / UI| Frontend
    Frontend -->|HTTP / REST API (JSON)| Backend
    Backend -->|TypeORM / Prisma (TCP)| Database
```

---

## 2. Diagrama de Entidad-Relación Inicial (E-commerce Core)

```mermaid
erDiagram
    USUARIO ||--o{ ORDEN : realiza
    USUARIO {
        uuid id PK
        string email UK
        string password_hash
        string nombre
        string rol
        datetime created_at
    }

    CATEGORIA ||--o{ PRODUCTO : contiene
    CATEGORIA {
        uuid id PK
        string nombre UK
        string descripcion
    }

    PRODUCTO ||--o{ ITEM_ORDEN : incluye
    PRODUCTO ||--o{ STOCK_MOVEMENT : registra_movimientos
    PRODUCTO {
        uuid id PK
        uuid categoria_id FK
        string nombre
        string descripcion
        decimal precio
        string imagen_url
        boolean activo
    }

    STOCK_MOVEMENT {
        uuid id PK
        uuid variante_id FK
        string tipo_movimiento "INGRESO_PROVEEDOR | VENTA | EXTRACCION_MANUAL"
        int cantidad "Mayor a 0"
        string motivo
        uuid usuario_id FK
        datetime created_at
    }

    USUARIO ||--o{ STOCK_MOVEMENT : autoriza
    ORDEN ||--|{ ITEM_ORDEN : contiene
    ORDEN {
        uuid id PK
        uuid usuario_id FK
        string estado
        decimal total
        datetime created_at
    }

    ITEM_ORDEN {
        uuid id PK
        uuid orden_id FK
        uuid producto_id FK
        int cantidad
        decimal precio_unitario
    }
```

> **Nota Arquitectónica:** No existe el campo mutable `stock` directamente en `PRODUCTO`. Las existencias se derivan exclusivamente del consolidado de `STOCK_MOVEMENT` (patrón Append-Only Ledger).

---

## 3. Diagrama de Clases del Dominio (UML)

El modelo de clases completo con sus atributos, jerarquías de herencia polimórficas (`EventoStock`, `Usuario`), multiplicidades y composiciones se encuentra documentado en:
📄 **[Ver Diagrama de Clases Detallado en Mermaid](./diagrama-de-clases.md)**

---

## 4. Convenciones para nuevos diagramas

* Se recomienda utilizar sintaxis **Mermaid** incrustada directamente en archivos Markdown para mantener versionado junto al código.
* Para diagramas de diseño visual exportados (PNG, SVG, Draw.io), guardarlos en esta carpeta con un nombre descriptivo (ej: `diagrama-flujo-checkout.svg`).
