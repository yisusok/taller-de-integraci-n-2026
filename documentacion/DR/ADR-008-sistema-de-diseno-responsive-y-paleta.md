# ADR-008: Sistema de Diseño Responsive, Paleta Extraída del Logo y Maquetación Mobile-First (UI-01)

* **Fecha:** 2026-11-20
* **Estado:** Aceptado
* **Autores / Decisores:** Equipo de Frontend y UX/UI Sneackers

---

## 1. Contexto y Planteamiento del Problema

La plataforma **Sneackers** requería unificar la identidad visual de la tienda online con los lineamientos gráficos definidos en el prototipo de Figma (`haSWATXDkcN7EDKIyKpdyr/Untitled`). Previamente, la interfaz contaba con una maquetación dispersa sin variables CSS estandarizadas, sin coherencia cromática y con un diseño no adaptado óptimamente a pantallas móviles.

Para dar cumplimiento a la especificación **[UI-01]**, la interfaz de usuario debe garantizar:
1. **Identidad de marca y paleta cromática:** Colores consistentes derivados del imagotipo e identidad corporativa de la marca de calzado deportivo.
2. **Arquitectura responsive (Mobile-First):** Experiencia nativa y fluida en smartphones (viewports estrechos), tablets y monitores de escritorio.
3. **Microinteracciones y animaciones sutiles:** Transiciones suaves no intrusivas que refuercen la usabilidad sin degradar la performance ni saturar al usuario.
4. **Diseño sobrio y modular:** Jerarquía tipográfica legible, elevación por sombras suaves y separación limpia de componentes visuales.

---

## 2. Decisiones de Diseño y Especificación Técnica

### 2.1. Tokens de Color y Paleta Extraída de la Marca

Se definen variables CSS globales en el contexto del storefront (`Storefront.css`) para centralizar la paleta:

| Token CSS | Valor Hex / Fallback | Propósito / Rol Visual |
|---|---|---|
| `--s-dark` | `#131416` | Negro carbón profundo para textos principales, header, botones dark y acentos de contraste. |
| `--s-dark-soft` | `#1d1f24` | Superficie oscura secundaria para estados hover y submenús. |
| `--s-red` | `#fa1a22` | Rojo deportivo insignia extraído del logo; para CTAs primarios, badges de descuento y acentos dinámicos. |
| `--s-red-hover` | `#dc141b` | Estado de interacción hover para botones y enlaces activos de marca. |
| `--s-bg` | `#fafbfd` | Fondo general de la aplicación (off-white limpio para descanso visual). |
| `--s-surface` | `#ffffff` | Fondo de cards, modales, drawers y elementos elevados. |
| `--s-soft` | `#f3f4f6` | Gris neutro claro para chips, inputs inactivos y bordes de contención. |
| `--s-tint` | `#e6efff` | Tinte azul sutil para áreas informativas o promocionales. |
| `--s-border` | `#e5e7eb` | Líneas divisorias, bordes de tablas y separadores sutiles. |
| `--s-border-strong` | `#d1d5db` | Bordes activos y estados de foco en controles. |
| `--s-text` | `#131416` | Color base tipográfico de alto contraste (cumple WCAG AA). |
| `--s-body` | `#4b5160` | Gris grafito para párrafos, leyendas y textos secundarios. |
| `--s-muted` | `#6b7280` | Metadatos, talles no seleccionados y placeholders. |
| `--s-green` | `#0b8a5f` | Indicadores de stock disponible y confirmaciones de éxito. |

### 2.2. Tipografía

* **Display / Marca (`--s-font-display`):** `'Outfit', system-ui, -apple-system, sans-serif`. Aporta carácter moderno, geométrico y deportivo para el imagotipo `SNEACKERS`, titulares h1/h2 y precios destacados.
* **Cuerpo y UI (`--s-font-body`):** `'Geist', system-ui, -apple-system, sans-serif`. Diseñada para máxima legibilidad en interfaces de comercio electrónico en densidades de píxeles altas y bajas.

### 2.3. Maquetación Mobile-First y Breakpoints

La estructura visual sigue una estrategia estricta mobile-first:
* **Móvil (< 768px):** 
  * Header compacto con botón hamburguesa (`sf-menu-toggle`), acceso directo a carrito y búsqueda colapsable.
  * Menú drawer deslizable lateral (`StoreNavDrawer`) con navegación por categorías de deportes, enlaces de cuenta y switch a backoffice.
  * Grids de 1 o 2 columnas en productos y bento grid apilado verticalmente.
* **Tablet (768px - 1023px):** Grids intermedios de 2 a 3 columnas, banners adaptativos con proporciones conservadas.
* **Desktop ($\ge$ 1024px):**
  * Barra de navegación horizontal completa con accesos directos, barra de búsqueda con atajo visual, drawer de carrito (`CartDrawer`) slide-over con backdrop desenfocado (`backdrop-filter: blur(4px)`).
  * Ancho de contenedor máximo acotado a `1280px` (`sf-container`) centrado para evitar fatiga ocular en pantallas ultra-wide.

### 2.4. Animaciones y Transiciones Sutiles

* **Curva y velocidad:** `--s-ease: 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
* **Microinteracciones en botones y cards:** Elevación suave en hover (`translateY(-2px)` junto con `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08)`).
* **Animaciones de entrada:**
  * `@keyframes sfFadeIn`: Aparición fluida de vistas y overlays.
  * `@keyframes sfSlideInRight` / `sfSlideInLeft`: Despliegue de drawers laterales con aceleración de hardware.
  * `@keyframes sfPulse`: Resaltado suave en estados de carga o alerta.

---

## 3. Consecuencias y Beneficios

* **Cohesión visual:** La tienda refleja fielmente los requerimientos de diseño de Figma, logrando una estética sobria, profesional y deportiva.
* **Rendimiento óptimo:** Estilos en CSS puro sin librerías pesadas de runtime, manteniendo el bundle liviano y tiempos de build en Vite inferiores a 1 segundo.
* **Accesibilidad:** Contraste tipográfico adecuado en fondos claros y elementos interactivos con tamaños de toque óptimos para dispositivos táctiles (mínimo 44px).

