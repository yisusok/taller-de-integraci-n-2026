# ADR-006: Libreta de Direcciones de Envío con Límite de 3 Domicilios y Gestión de Predeterminada (AUTH-06)

* **Fecha:** 2026-10-29
* **Estado:** Aceptado
* **Contexto del Proyecto:** Plataforma E-commerce &bull; Perfil del Cliente y Gestión de Envíos

---

## 1. Contexto y Planteamiento del Problema

Para optimizar el flujo de checkout y la experiencia del cliente registrado, se requiere una libreta de direcciones de envío en su perfil con las siguientes reglas de negocio:
1. **Límite cuantitativo:** Cada cliente puede registrar un **máximo de 3 domicilios** de envío. Intentos de registrar un 4to domicilio deben ser bloqueados con validación explícita (HTTP 400 Bad Request).
2. **Indicador de dirección predeterminada:**
   - Debe existir un indicador único de dirección predeterminada (`es_predeterminada: boolean`).
   - El primer domicilio registrado se asigna automáticamente como predeterminado.
   - Si el cliente marca una dirección como predeterminada, cualquier otra dirección previa debe desmarcarse automáticamente para garantizar la unicidad de la dirección predeterminada por cliente.
   - Si se elimina la dirección predeterminada y aún quedan otros domicilios en la libreta, el sistema debe reasignar automáticamente la condición de predeterminada a una de las direcciones restantes.
3. **Seguridad y Control de Acceso:**
   - Las operaciones CRUD de domicilios (`/api/addresses`) están protegidas mediante `JwtAuthGuard` y restringidas a clientes autenticados (`cliente` y `administrador`), impidiendo accesos anónimos.
   - Aislamiento multi-inquilino (prevención de IDOR): Cada consulta, modificación o baja valida que el `user_id` del domicilio coincida estrictamente con el `sub` (ID del usuario) provisto en el token JWT.

---

## 2. Decisión Adoptada

### Backend (NestJS + TypeORM + PostgreSQL)

1. **Entidad `Address` (`addresses`):**
   - Clave primaria UUID (`id`).
   - Clave foránea `user_id` vinculada a `users(id)` con `onDelete: 'CASCADE'`.
   - Atributos domiciliarios: `alias`, `calle`, `numero`, `piso_depto`, `ciudad`, `provincia`, `codigo_postal`.
   - Bandera booleana `es_predeterminada` (default `false`).
   - Marcas temporales `created_at` y `updated_at`.

2. **Lógica de Servicio (`AddressesService`):**
   - Constante `MAX_ADDRESSES_PER_USER = 3`.
   - `create`: Cuenta las direcciones existentes del usuario mediante `count({ where: { userId } })`. Si `count >= 3`, rechaza la solicitud.
   - `setDefault` y actualización con bandera: Invoca `update({ userId }, { esPredeterminada: false })` antes de marcar la seleccionada.
   - `remove`: Si la dirección eliminada era la predeterminada, consulta la siguiente dirección más antigua (`order: { createdAt: 'ASC' }`) y la promueve a predeterminada.

3. **Decorador `@CurrentUser()`:**
   - Inyecta el usuario decodificado desde el token JWT para desacoplar el controlador y evitar la manipulación de IDs en los payloads del cliente.

### Frontend (React 19 + TypeScript)

1. **Componente `AddressBook`:**
   - Integrado en el perfil del cliente.
   - Contador visual `X / 3 domicilios` con alerta al alcanzar el cupo máximo.
   - Tarjetas responsivas con distinción visual para la dirección predeterminada (`⭐ Predeterminada`).
   - Botón directo "Marcar predeterminada" con actualización en tiempo real.
   - Formulario modal para registrar o editar domicilios con validación de campos obligatorios.

---

## 3. Matriz de Operaciones y Reglas

| Operación | Endpoint | Validación / Restricción |
| :--- | :--- | :--- |
| **Listar** | `GET /api/addresses` | Retorna únicamente domicilios del `userId` en sesión (predeterminada primero). |
| **Crear** | `POST /api/addresses` | Rechaza con HTTP 400 si `count >= 3`. Asigna predeterminada si es la primera. |
| **Actualizar** | `PATCH /api/addresses/:id` | Verifica propiedad del domicilio (`userId`). Desmarca otras si se asigna predeterminada. |
| **Marcar Default** | `PATCH /api/addresses/:id/default` | Desmarca anteriores y asigna la actual como predeterminada. |
| **Eliminar** | `DELETE /api/addresses/:id` | Verifica propiedad. Si era default, promueve la siguiente restante. |

---

## 4. Consecuencias y Beneficios

* **Prevención de Abuso y Consistencia:** El tope de 3 direcciones previene saturación de datos y mantiene una libreta ordenada y manejable.
* **Experiencia de Checkout Simplificada:** Al contar siempre con una dirección predeterminada válida, el usuario puede realizar compras en menos pasos.
* **Seguridad Robusta:** Ningún usuario puede consultar, alterar ni borrar domicilios ajenos.
