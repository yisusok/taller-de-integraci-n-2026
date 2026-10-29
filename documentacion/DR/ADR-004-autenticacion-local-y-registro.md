# ADR-004: Autenticación Local, Saneamiento de Entradas y Manejo de Errores (AUTH-02)

* **Fecha:** 2026-10-21
* **Estado:** Aceptado
* **Contexto del Proyecto:** Plataforma E-commerce &bull; Módulo de Autenticación

---

## 1. Contexto y Planteamiento del Problema
Para la funcionalidad de registro de usuarios tradicionales (correo y contraseña), se requiere garantizar:
1. Saneamiento y validación estricta de datos de entrada (prevención de inyecciones, espacios redundantes, normalización de correos electrónicos a minúsculas).
2. Seguridad en el almacenamiento de credenciales: almacenamiento exclusivo de contraseñas mediante funciones hash criptográficas con sal (salt).
3. Manejo explícito y semántico de errores ante intentos de registro duplicado de correo electrónico (HTTP 409 Conflict) y ante datos inválidos (HTTP 400 Bad Request).
4. Interfaz de usuario (React) con validaciones en tiempo real, protección contra envíos duplicados (loading state) y retroalimentación explícita para el usuario.

---

## 2. Decisión Adoptada

### Backend (NestJS + TypeORM)
1. **Validación y Saneamiento (DTOs):** Se utiliza `ValidationPipe` global con `class-validator` y `class-transformer` con `whitelist: true`, saneando `nombre` (trim), `correo_electronico` (trim y conversión a minúsculas) y exigiendo contraseñas de al menos 8 caracteres.
2. **Criptografía (Hashing de contraseñas):** Se implementa `bcryptjs` con 10 rondas de salt para generar el `contrasena_hash` antes de persistir la entidad `Usuario`.
3. **Manejo de Errores:**
   - Si `correo_electronico` ya existe en la base de datos (verificado por consulta y respaldado por la restricción única de PostgreSQL `23505`), se lanza `ConflictException` (código HTTP 409) con mensaje descriptivo.
   - En respuestas exitosas (HTTP 201 Created), la contraseña y su hash son omitidos del payload devuelto.


## 3. Consecuencias

### Positivas
* Se previene el almacenamiento de contraseñas en texto plano y se garantiza resistencia ante ataques de fuerza bruta mediante bcrypt.
* Se evita la proliferación de cuentas duplicadas por diferencias de mayúsculas/minúsculas o espacios accidentales.
* Respuestas semánticas de acuerdo con los estándares REST (201 Created, 400 Bad Request, 409 Conflict).
