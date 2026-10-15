# Documentación del Proyecto - Taller de Integración 2026

Bienvenido al centro de documentación del proyecto **E-commerce**.

## Estructura de Documentación

* **[DR (Decision Records)](./DR/README.md):** Registros formales de decisiones de arquitectura y diseño técnico tomadas por el equipo.
  * [ADR-001: Selección del Stack Tecnológico (NestJS, React y PostgreSQL)](./DR/ADR-001-stack-tecnologico.md)
* **[Diagramas](./diagramas/README.md):** Diagramas del sistema (Arquitectura general C4, Modelo Entidad-Relación de la base de datos PostgreSQL, flujos de procesos).

---

## Stack Tecnológico

| Componente | Tecnología | Rol |
|---|---|---|
| **Backend** | [NestJS](https://nestjs.com/) | API REST modular, inyección de dependencias, validaciones y lógica de negocio. |
| **Frontend** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) | Interfaz de usuario SPA responsiva y componentes reutilizables. |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/) | Base de datos relacional transaccional (ACID) instalada localmente o en la nube. |
