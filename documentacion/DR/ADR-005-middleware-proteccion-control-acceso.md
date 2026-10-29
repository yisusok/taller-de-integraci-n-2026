# ADR-005: Middleware de Protección, Control de Acceso (RBAC) y Seguridad en Rutas (AUTH-05)

* **Fecha:** 2026-10-29
* **Estado:** Aceptado
* **Contexto del Proyecto:** Plataforma E-commerce &bull; Módulo de Autenticación y Autorización

---

## 1. Contexto y Planteamiento del Problema

En la plataforma se requiere establecer un modelo de seguridad robusto alineado con los tres roles del dominio:
* **`visitante`**: Usuario no autenticado que navega por el sitio.
* **`cliente`**: Usuario registrado que puede realizar compras y guardar preferencias.
* **`administrador`**: Usuario con privilegios de gestión de backoffice y operaciones internas.

Objetivos clave:
1. **Protección de rutas de backoffice:** Las operaciones de gestión interna (como el registro de movimientos de stock y auditoría de existencias) deben estar estrictamente restringidas al rol `administrador`. Los roles `cliente` y `visitante` no tienen autorización.
2. **Navegación libre en catálogo:** Se debe permitir la navegación anónima del `visitante` en el storefront (catálogo de productos, variantes, talles y colores) sin forzar un login previo, optimizando la experiencia del usuario y el embudo de conversión.
3. **Interacciones protegidas en el storefront:** Cualquier intento de interactuar con el carrito de compras (agregar productos, visualizar pedidos) o gestionar lista de favoritos debe exigir autenticación previa (forzar paso de visitante a cliente autenticado).
4. **Validación criptográfica en backend:** Garantizar que los servicios API verifiquen la identidad mediante tokens JWT firmados y apliquen control de acceso basado en roles (RBAC).

---

## 2. Decisión Adoptada

### Backend (NestJS + Passport + JWT)

1. **Definición Estricta de Roles (`RolUsuario`):**
   ```typescript
   export enum RolUsuario {
     ADMINISTRADOR = 'administrador',
     CLIENTE = 'cliente',
     VISITANTE = 'visitante',
   }
   ```

2. **Estrategia JWT y Emisión de Tokens:**
   - Se integran `@nestjs/jwt`, `@nestjs/passport` y `passport-jwt`.
   - Tanto el login tradicional con credenciales (`POST /api/auth/login`) como la sincronización federada (`POST /api/auth/sync-oauth`) emiten un token firmado `access_token` (algoritmo HS256) con payload `{ sub: userId, email, rol }`.

3. **Seguridad por Defecto (Default Deny):**
   - Se registra un guard global `JwtAuthGuard` a nivel de `AppModule` mediante `APP_GUARD`.
   - Todas las rutas requieren un token Bearer válido, a menos que estén explícitamente decoradas con `@Public()`.
   - Se marcan como `@Public()` los endpoints de registro, login, sincronización OAuth, recuperación de contraseñas y el health check `/api/health`.

4. **Control de Acceso Basado en Roles (RBAC):**
   - Se implementa el decorador `@Roles(...roles: RolUsuario[])` y el guard `RolesGuard`.
   - Se restringen las operaciones de Backoffice (`StockController`) exclusivamente al rol `administrador`:
     - `POST /api/stock/movimientos`: `@Roles(RolUsuario.ADMINISTRADOR)`
     - `GET /api/stock/**`: `@Roles(RolUsuario.ADMINISTRADOR)`
     - Usuarios con rol `cliente` o `visitante` reciben `HTTP 403 Forbidden` (`Acceso denegado: se requiere uno de los roles [administrador]`).
     - Visitantes anónimos sin token reciben `HTTP 401 Unauthorized`.

### Frontend (React + Vite)

1. **Gestión de Sesión y Token:**
   - El token `access_token` se persiste en almacenamiento seguro local y se envía en los encabezados `Authorization: Bearer <token>` en llamadas protegidas.
   - En el cierre de sesión (`handleLogout`), se purgan las credenciales y el token de forma sincronizada.

2. **Navegación Anónima e Intercepciones de Middleware:**
   - La vista de Catálogo (`store`) es de libre acceso público para el visitante.
   - Al hacer clic en **"Agregar al Carrito"**, **"Favoritos" (❤️/🤍)** o en el botón del **Carrito**, el middleware de cliente evalúa la presencia de `activeUser`.
   - Si el usuario es un visitante no autenticado, se intercepta la acción, se despliega un mensaje informativo claro (*"Debes iniciar sesión para agregar productos al carrito o guardar favoritos"*) y se redirige fluidamente al tab de autenticación.

3. **Panel de Verificación de Backoffice:**
   - Se incorpora una vista para validar el comportamiento del RBAC: los visitantes anónimos o clientes reciben rechazo explícito (HTTP 401/403), mientras que el `administrador` autenticado puede consultar las existencias.

---

## 3. Matriz de Control de Acceso

| Rol / Estado | Catálogo Público | Carrito / Favoritos | Consulta Stock (Backoffice) | Registro Movimiento Stock |
| :--- | :---: | :---: | :---: | :---: |
| **Visitante (`visitante` / Anónimo)** | ✅ Permitido | 🔒 Requiere Login | ⛔ 401 Unauthorized | ⛔ 401 Unauthorized |
| **Cliente (`cliente`)** | ✅ Permitido | ✅ Permitido | ⛔ 403 Forbidden | ⛔ 403 Forbidden |
| **Administrador (`administrador`)** | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido |

---

## 4. Consecuencias y Beneficios

* **Modelo Simple y Coherente:** Se eliminan roles redundantes, estableciendo tres perfiles claramente diferenciados (`visitante`, `cliente` y `administrador`).
* **Defensa en Profundidad:** La combinación de guards globales en backend con validaciones interactivas en frontend previene accesos no autorizados tanto a nivel de interfaz como ante solicitudes directas por API.
* **Experiencia de Usuario No Invasiva:** Los visitantes pueden explorar el catálogo sin barreras iniciales, solicitando credenciales únicamente al manifestar intención de compra o personalización.
