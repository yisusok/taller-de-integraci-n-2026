# ADR-003: Gestión de Existencias basada en Libro Mayor (Append-Only Stock Ledger) e Inmutabilidad

* **Fecha:** 2026-10-15
* **Estado:** Aceptado
* **Contexto del Proyecto:** Módulo de Inventario y Stock de E-commerce

---

## 1. Contexto y Planteamiento del Problema
En plataformas de comercio electrónico tradicionales, es frecuente encontrar implementaciones donde el stock es un campo numérico mutable (por ejemplo: `UPDATE producto SET stock = stock - 1`).

Este enfoque presenta graves deficiencias en entornos de producción:
* **Pérdida de trazabilidad y auditoría:** Imposibilidad de saber quién, cuándo y por qué se modificó el inventario (robos, pérdidas, ingresos de mercadería, compras fallidas).
* **Condiciones de carrera y sobreventas:** Múltiples transacciones concurrentes pueden sobreeescribir el valor sin consistencia.
* **Falta de conciliación contable:** Dificultad para auditar discrepancias entre las órdenes vendidas y el inventario físico en depósito.

---

## 2. Decisión Adoptada: Append-Only Stock Ledger
Se prohíbe terminantemente la mutación directa sobre las existencias de productos/variantes. 
En su lugar, se adopta el patrón de **Libro Mayor de Movimientos de Stock (Append-Only Stock Movement Ledger)**:

### 1. Entidad `StockMovement`
Se crea la tabla `stock_movements` con los siguientes campos:
* `id` (UUID, Primary Key): Identificador único del movimiento.
* `variante_id` (UUID, Indexed): Identificador de la variante de producto afectada.
* `tipo_movimiento` (Enum):
  * `INGRESO_PROVEEDOR`: Entrada de mercadería / compra a proveedor (+).
  * `VENTA`: Salida por compra confirmada del cliente (-).
  * `EXTRACCION_MANUAL`: Ajuste por merma, rotura o devolución interna (-).
* `cantidad` (Integer > 0): Unidades involucradas en la operación.
* `motivo` (Text): Justificación obligatoria del movimiento.
* `usuario_id` (UUID, Nullable): Identificador del usuario o sistema que originó el registro.
* `created_at` (Timestamp with time zone): Fecha y hora exacta de creación.

### 2. Prohibición Estricta de Mutaciones
* **A nivel de Aplicación (NestJS / TypeORM):** Los métodos `UPDATE`, `PATCH` y `DELETE` no existen en los endpoints ni servicios de stock. Los hooks `@BeforeUpdate` y `@BeforeRemove` en la entidad arrojan una excepción si se intenta alterar un registro existente.
* **A nivel de Base de Datos (PostgreSQL):** Se implementa el trigger `trg_prevent_stock_movement_mutation` que aborta cualquier sentencia `UPDATE` o `DELETE` sobre la tabla `stock_movements`.
* **Cálculo de Existencias:** El stock actual de una variante se calcula exclusivamente como la suma de sus ingresos menos sus egresos:
  $$\text{Stock} = \sum \text{INGRESO\_PROVEEDOR} - (\sum \text{VENTA} + \sum \text{EXTRACCION\_MANUAL})$$

---

## 3. Consecuencias

### Positivas
* **Auditoría total 100% garantizada:** Cada unidad que entra o sale tiene motivo, usuario, timestamp y tipo de operación.
* **Consistencia e idempotencia:** Facilita la reconciliación entre pasarelas de pago, órdenes y depósito físico.
* **Imposibilidad de alteración fraudulenta:** Ni siquiera un administrador puede alterar registros pasados de stock.

### Negativas / Mitigaciones
* Mayor volumen de filas a lo largo del tiempo.
* *Mitigación:* Se crearon índices compuestos `(variante_id, created_at)` y vistas materializadas/cacheadas para consultas de alta concurrencia en el catálogo.

---

## 4. Extracción manual y garantías de integridad (STOCK-02 / STOCK-03)

* **Endpoint dedicado:** `POST /api/stock/extracciones-manuales` (solo `administrador`) fuerza `EXTRACCION_MANUAL` y exige `variante_id`, `cantidad` entera > 0 y `motivo` (mínimo 5 caracteres).
* **Auditoría no falsificable:** `usuario_id` nunca viaja en el cuerpo de la petición; se toma siempre del token JWT.
* **Saldo calculado en SQL:** `GET /api/stock/variantes/:id` agrega los totales por tipo con `SUM ... GROUP BY`, en lugar de cargar el historial en memoria.
* **Sin sobreventa por concurrencia:** las salidas (`VENTA` y `EXTRACCION_MANUAL`) toman un `pg_advisory_xact_lock` por variante dentro de la transacción antes de validar el saldo.
* **Inmutabilidad real en la base:** al iniciar el módulo se instala de forma idempotente el trigger `trg_prevent_stock_movement_mutation`, de modo que no depende de ejecutar el script SQL a mano cuando el esquema lo crea TypeORM (`synchronize`).
* **Consulta del historial:** `GET /api/stock/movimientos` admite `limit`, `offset`, `tipo_movimiento` y `variante_id`.

---

## 5. Alertas de stock bajo y monitoreo de reposición (STOCK-04)

* **Consulta agregada en SQL con cláusula `HAVING`:** `GET /api/stock/alertas?umbral=N` calcula existencias consolidadas por variante agrupando el libro mayor en tiempo real (`GROUP BY m.variante_id HAVING existencias <= :umbral`), evitando cálculos iterativos en memoria o lecturas completas de la tabla.
* **Clasificación por severidad:**
  * `agotado`: existencias $\le 0$ unidades (quiebre de inventario total).
  * `critico`: existencias $\le \lfloor\text{umbral} / 2\rfloor$ (riesgo inminente).
  * `bajo`: existencias $\le \text{umbral}$ (punto de reposición alcanzado).
* **Control RBAC:** Endpoint estrictamente protegido para rol `administrador`.
* **Integración en panel administrativo:** Indicador reactivo de alertas en la navegación lateral del backoffice y panel interactivo con atajos rápidos de extracción y auditoría.

