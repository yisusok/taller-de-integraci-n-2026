# Decision Records (Architecture Decision Records - ADR)

## ¿Qué es un Decision Record (ADR)?

Un **Architecture Decision Record (ADR)** o **Registro de Decisiones de Arquitectura** es un documento breve que captura una decisión arquitectónica o de diseño significativa tomada en el proyecto, junto con su contexto, las alternativas consideradas, el motivo de la elección y las consecuencias que dicha decisión conlleva.

Los proyectos de software evolucionan constantemente y los equipos cambian con el tiempo. Sin un registro formal de decisiones, es común preguntarse:
* *¿Por qué se eligió esta tecnología o patrón?*
* *¿Qué alternativas se evaluaron y por qué se descartaron?*
* *¿Qué compromisos o trade-offs aceptamos en su momento?*

El objetivo de los ADRs es mantener la memoria arquitectónica del proyecto accesible, transparente y versionada junto con el código fuente.

---

## Estructura de un ADR

Cada ADR se numera de forma secuencial y sigue un formato estándar:

```text
documentacion/DR/ADR-001-titulo-descriptivo.md
```

### Plantilla sugerida para nuevos ADRs

```markdown
# ADR-[Número]: [Título de la decisión]

* **Fecha:** [YYYY-MM-DD]
* **Estado:** [Propuesto | Aceptado | Rechazado | Deprecado | Superado por ADR-XXX]
* **Autores / Decisores:** [Nombres de los integrantes]

## 1. Contexto y Planteamiento del Problema
Descripción de la situación actual, los requerimientos técnicos o de negocio y el problema que necesitamos resolver.

## 2. Opciones Consideradas
* **Opción 1:** [Descripción, ventajas y desventajas]
* **Opción 2:** [Descripción, ventajas y desventajas]
* **Opción 3:** [Descripción, ventajas y desventajas]

## 3. Decisión Adoptada
Explicación clara de la alternativa elegida y la justificación técnica que fundamenta la decisión.

## 4. Consecuencias
* **Positivas:** Qué beneficios inmediatos y a largo plazo obtenemos.
* **Negativas / Riesgos:** Qué desventajas, complejidad adicional o deuda técnica asumimos y cómo se mitigará.
```

---

## Estados de un ADR

* **Propuesto:** La decisión está siendo evaluada y debatida por el equipo.
* **Aceptado:** La decisión ha sido aprobada y se implementa en el proyecto.
* **Rechazado:** La propuesta fue descartada tras la evaluación técnica.
* **Deprecado:** La decisión ya no aplica debido a cambios estructurales o de contexto.
* **Superado (Superseded):** Una nueva decisión reemplaza a esta (debe enlazar al nuevo ADR).

---

## Índice de Decisiones

| ID | Título | Fecha | Estado |
|---|---|---|---|
| [ADR-001](./ADR-001-stack-tecnologico.md) | Selección del Stack Tecnológico: NestJS, React y PostgreSQL | 2026-10-15 | Aceptado |
| [ADR-002](./ADR-002-estrategia-ci-cd.md) | Estrategia de Integración Continua (CI/CD) con GitHub Actions | 2026-10-15 | Aceptado |
| [ADR-003](./ADR-003-gestion-stock-ledger.md) | Gestión de Stock basada en Libro Mayor (Append-Only Ledger) e Inmutabilidad | 2026-10-15 | Aceptado |
| [ADR-004](./ADR-004-autenticacion-local-y-registro.md) | Autenticación Local, Saneamiento de Entradas y Manejo de Errores (AUTH-02) | 2026-10-21 | Aceptado |
| [ADR-005](./ADR-005-middleware-proteccion-control-acceso.md) | Middleware de Protección, Control de Acceso (RBAC) y Seguridad en Rutas (AUTH-05) | 2026-10-29 | Aceptado |
