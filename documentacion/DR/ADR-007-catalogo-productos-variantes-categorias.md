# ADR-007: Catálogo de Productos, Variantes y Categorías Integrado al Libro Mayor de Stock (CAT-01)

* **Fecha:** 2026-11-19
* **Estado:** Aceptado
* **Autores / Decisores:** Equipo de Ingeniería Sneackers

---

## 1. Contexto y Planteamiento del Problema

La tienda **Sneackers** requiere administrar su catálogo comercial (categorías como urbanas, casuales, deportivas, accesorios y combos; productos con precios, costos, garantía y etiquetas de uso/deporte; y variantes por talle, color y material) conectándolo con dos restricciones arquitectónicas fundamentales del negocio:

1. **Separación estricta respecto al stock mutable (ADR-003):** Ni `Producto` ni `Variante` pueden almacenar una columna editable de stock disponible. Toda entrada o salida física de mercadería debe ocurrir mediante eventos inmutables en `stock_movements`.
2. **Despriorización pública de productos agotados:** Los artículos con stock total igual a 0 deben seguir mostrándose en la tienda con el indicador visual *"Sin stock"*, pero relegados al final de los listados públicos.
3. **Integridad histórica:** No se debe permitir eliminar físicamente productos o variantes que ya posean movimientos en el libro mayor de inventario.

---

## 2. Opciones Consideradas

* **Opción 1:** Guardar un campo `stockActual` en `variantes` actualizado por triggers o callbacks en cada movimiento.
  * *Descartada:* Duplica la fuente de verdad, introduce riesgo de desincronización con el ledger append-only y viola lo establecido en ADR-003.
* **Opción 2:** Modelar `categorias`, `productos` y `variantes` como entidades puramente descriptivas y calcular `stock_actual` / `stock_total` en tiempo real mediante una única consulta SQL agregada en lote sobre `stock_movements`, desacoplando los endpoints públicos de lectura (`@Public()`) de las mutaciones administrativas (`@Roles(ADMINISTRADOR)`).

---

## 3. Decisión Adoptada

Se adopta la **Opción 2** con las siguientes definiciones técnicas:

1. **Esquema relacional e integridad en PostgreSQL (`categorias`, `productos`, `variantes`):**
   * **`Categoria`:** `id` (UUID), `nombre` único **case-insensitive en base de datos** mediante el índice único funcional `uq_categorias_nombre_lower (LOWER(nombre))`, índice `idx_categorias_activa`, `descripcion`, `activa`, timestamps. Impide eliminación física si posee productos asociados.
   * **`Producto`:** `id` (UUID), `sku` único normalizado a mayúsculas, `nombre`, `descripcion`, `marca`, `costo` y `precio` (`decimal(10,2)` con transformador numérico y restricciones `CHECK (costo >= 0)` y `CHECK (precio >= 0)`), `garantia`, `uso_recomendado`, `etiquetas` (`text[]` con índice `GIN` `idx_productos_etiquetas_gin`), `imagen_url` (validada con protocolo `http`/`https`), `activo`, `categoria_id` (`ON DELETE RESTRICT`, indexado en `idx_productos_categoria_id`), e índices `(activo, created_at)` y `marca`.
   * **`Variante`:** `id` (UUID), `producto_id` (`ON DELETE CASCADE`), `talle`, `color`, `material`, `sku_variante` obligatorio no nulo (`varchar(80) UNIQUE`) autogenerable desde SKU base + color + talle, `activa`, `created_at` y `updated_at`, con índice compuesto `idx_variantes_producto_activa` e índice único funcional `uq_variantes_producto_talle_color_lower (producto_id, LOWER(talle), LOWER(color))`.

2. **Integración en lote, paginación y despriorización SQL con `StockService`:**
   * `GET /api/productos` y `GET /api/productos/admin` resuelven paginación (`limit`, `offset`) y ordenamiento en SQL; en el endpoint público, una subconsulta sobre `stock_movements` calcula `has_stock` (`> 0`) para ordenar productos disponibles antes que agotados (`ORDER BY has_stock DESC, created_at DESC`), escapando comodines `LIKE` (`%`, `_`, `\`).
   * `StockService.getStockByVariants(varianteIds)` hidrata el saldo de las variantes de la página en una sola sentencia `SUM ... GROUP BY` parametrizada.
   * `stock_movements.variante_id` posee clave foránea real (`ON DELETE RESTRICT`) hacia `variantes(id)`, garantizando a nivel de motor (junto a `StockService.hasMovements`) que ningún producto o variante con historial pueda eliminarse físicamente (traducido a `409 Conflict` por `PgExceptionFilter`).

3. **Seguridad y separación estricta Público vs Admin:**
   * **Rutas públicas (`@Public()`):** `GET /api/categorias`, `GET /api/categorias/:id`, `GET /api/productos`, `GET /api/productos/:id`, `GET /api/variantes`, `GET /api/variantes/:id`. Filtran estrictamente entidades activas y mapean a `ProductoPublico` / `VariantePublica`, **omitiendo campos internos como `costo`**.
   * **Rutas administrativas (`@Roles(RolUsuario.ADMINISTRADOR)`):** `GET /api/categorias/admin`, `GET /api/productos/admin`, `GET /api/productos/admin/:id`, `GET /api/variantes/admin`, más todas las mutaciones (`POST`, `PATCH`, `DELETE`). `ValidationPipe` opera sin `enableImplicitConversion` para evitar coerciones booleanas silenciosas (`"false"` → `true`), y la creación con variantes iniciales se ejecuta dentro de una transacción (`dataSource.transaction`).

---

## 4. Consecuencias

* **Positivas:**
  * Única fuente de verdad para existencias: cero discrepancias entre catálogo, carrito futuro e inventario.
  * El asistente de búsqueda y el storefront ya disponen de etiquetas de deporte/uso (`etiquetas`, `uso_recomendado`) y filtrado por categorías activas.
  * Protección garantizada ante borrados accidentales de historial contable.
* **Negativas / Riesgos:**
  * A medida que crezca el volumen de `stock_movements`, la agregación por lote requerirá índices compuestos (ya previstos en ADR-003) o vistas materializadas por variante.
