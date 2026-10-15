# ADR-002: Estrategia de Integración Continua (CI/CD) con GitHub Actions

* **Fecha:** 2026-10-15
* **Estado:** Aceptado
* **Contexto del Proyecto:** Calidad de Código y Validación Automatizada para E-commerce

---

## 1. Contexto y Planteamiento del Problema
En el desarrollo de una plataforma de comercio electrónico crítica (gestión de stock, pasarelas de pago y datos transaccionales), depender de revisiones y ejecuciones manuales de pruebas antes de fusionar código genera:
* Riesgo de incorporar código que no compile en producción.
* Violación de estándares de tipado estricto en TypeScript.
* Errores de sintaxis o regresiones no detectadas en los cálculos de órdenes o inventario.
* Desincronización de dependencias entre los entornos locales del equipo.

Se necesita un mecanismo automatizado que audite la calidad del código de forma obligatoria ante cada cambio o Pull Request.

---

## 2. Opciones Consideradas
1. **GitHub Actions:** Integración nativa directa en el repositorio, soporte de matrices de ejecución paralela, caché de dependencias npm out-of-the-box y sin costo adicional para repositorios públicos/estudiantiles.
2. **GitLab CI / Bitbucket Pipelines:** Potentes, pero requieren cambiar de plataforma de alojamiento o configurar runners externos complejos.
3. **Validación manual mediante Git Hooks (Husky):** Útil para validación previa al commit, pero puede ser omitido por los desarrolladores mediante flags (`--no-verify`) y no garantiza una validación centralizada en el servidor.

---

## 3. Decisión Adoptada
Se adopta **GitHub Actions** mediante el workflow centralizado `.github/workflows/ci.yml`.

El pipeline ejecuta dos flujos en paralelo en cada `push` o `pull_request` a las ramas `main` y `develop`:
* **Backend (NestJS):**
  1. `npm ci` con caché nativa.
  2. `npm run lint` (ESLint con reglas de TypeScript estricto).
  3. `npm run test` (Pruebas unitarias de servicios y controladores con Jest).
  4. `npm run build` (Verificación de compilación del backend).
* **Frontend (React):**
  1. `npm ci` con caché nativa.
  2. `npm run lint` (Oxlint para calidad y rapidez de análisis).
  3. `npm run build` (Typecheck con `tsc -b` y build de producción con Vite).

---

## 4. Consecuencias

### Positivas
* **Bloqueo preventivo:** Ningún Pull Request podrá integrarse si rompe los tipos de TypeScript, si falla las pruebas unitarias o si incumple el linter.
* **Tiempos de ejecución reducidos:** Ambos jobs corren concurrentemente en paralelo, aprovechando el caché de `npm`.
* **Cero configuración en servidores externos:** Ejecución en contenedores efímeros administrados por GitHub.

### Negativas / Mitigaciones
* Requiere mantener actualizados los archivos `package-lock.json` para garantizar la reproducibilidad con `npm ci`.
