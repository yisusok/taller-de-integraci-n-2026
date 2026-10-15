# ADR-001: Selección del Stack Tecnológico (NestJS, React y PostgreSQL)

* **Fecha:** 2026-10-15
* **Estado:** Aceptado
* **Contexto del Proyecto:** Plataforma E-commerce

---

## 1. Contexto y Planteamiento del Problema
Para el desarrollo de la plataforma de comercio electrónico (E-commerce) en el marco de Taller de Integración 2026, se requiere definir la arquitectura base y el stack de tecnologías que soporten:
* Manejo de catálogo de productos, inventario, usuarios, carritos y órdenes de compra.
* Escalabilidad, mantenibilidad y modularidad en el backend.
* Una experiencia de usuario moderna, reactiva y veloz en el frontend.
* Integridad referencial y consistencia de datos transaccionales (crítico en ventas, stock y transacciones monetarias).

---

## 2. Opciones Consideradas

### Backend
1. **NestJS (Node.js + TypeScript):** Framework empresarial estructurado por módulos, controladores y servicios, con soporte nativo de TypeScript, inyección de dependencias y validaciones robustas.
2. **Express.js estándar:** Ligero y flexible, pero carece de estructura predeterminada, lo que tiende a generar inconsistencias arquitectónicas en equipos.
3. **FastAPI / Django (Python):** Robustos para procesamiento de datos, pero fragmenta el stack tecnológico a múltiples lenguajes de desarrollo.

### Frontend
1. **React (con Vite + TypeScript):** Ecosistema masivo, alto rendimiento, reactividad mediante componentes reutilizables, tipado estático y tiempos de compilación instantáneos con Vite.
2. **Next.js:** Excelente para SSR/SEO, pero agrega complejidad inicial de infraestructura y despliegue si se busca separar estrictamente backend y frontend.
3. **Vue.js:** Curva de aprendizaje amigable, pero menor soporte y adopción en el equipo en comparación con React.

### Base de Datos
1. **PostgreSQL:** Sistema de base de datos relacional (RDBMS) open source líder, soporte completo ACID, JSONB para atributos flexibles de productos y gran rendimiento para operaciones transaccionales.
2. **MySQL:** Relacional y popular, pero menor flexibilidad avanzada en tipos de datos y extensiones frente a PostgreSQL.
3. **MongoDB (NoSQL):** Modelo documental flexible, pero carece de la consistencia relacional nativa y transacciones estrictas requeridas típicamente por catálogos con inventario estricto y órdenes financieras.

---

## 3. Decisión Adoptada
Se adopta formalmente el stack:
* **Backend:** **NestJS** con TypeScript, organizado bajo arquitectura modular en capas (Controllers, Services, Repositories/Entities).
* **Frontend:** **React** con TypeScript y Vite como herramienta de empaquetado y servidor de desarrollo.
* **Base de Datos:** **PostgreSQL** para la persistencia transaccional y relacional.

---

## 4. Consecuencias

### Positivas
* **Lenguaje unificado:** TypeScript en todo el ciclo (Frontend y Backend), facilitando compartir contratos de tipos, interfaces de DTOs y modelos.
* **Arquitectura limpia:** NestJS impone buenas prácticas de arquitectura empresarial desde el día uno (patrón Singleton, Inyección de Dependencias, Decoradores).
* **Consistencia e Integridad:** PostgreSQL garantiza transacciones ACID seguras para reservas de stock, pagos y generación de facturas/órdenes.
* **Agilidad en Frontend:** React + Vite ofrece recarga en caliente instantánea (HMR) y alta modularidad de componentes UI.

### Negativas / Mitigaciones
* Curva de aprendizaje de NestJS para miembros no familiarizados con Inyección de Dependencias y TypeScript estricto (se mitiga con la documentación y estructura estandarizada).
* Requiere configuración de migraciones y mapeador relacional (ORM) como TypeORM o Prisma para interactuar con PostgreSQL de manera tipada.
