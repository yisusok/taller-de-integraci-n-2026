# Diagrama de Clases del Dominio (E-Commerce)

Este diagrama representa la estructura de clases del modelo de dominio del sistema, sus atributos, operaciones, jerarquías de herencia y multiplicidades.

---

## 1. Código Mermaid

```mermaid
classDiagram
    direction TB

    class Usuario {
        +UUID id
        +string nombre
        +string email
        +string password
        +string metodoAuth
        +Date fechaRegistro
    }

    class AdminVentas {
        +string permisos
    }

    class Cliente {
    }

    class Direccion {
        +UUID id
        +string calle
        +int numero
        +string ciudad
        +int cp
    }

    class Pedido {
        +UUID id
        +int numero
        +Date fecha
        +EstadoPedido estado
        +float total
    }

    class ItemPedido {
        +UUID id
        +int cantidad
        +float precioUnitario
    }

    class Pago {
        +UUID id
        +string preferenciaId
        +float monto
        +EstadoPago estado
        +string metodoPago
    }

    class Comprobante {
        +UUID id
        +string skuBase
        +date FEmision
        +string urlPdf
    }

    class Carrito {
        +UUID id
    }

    class ItemCarrito {
        +UUID id
        +int cantidad
        +float precioUnitario
    }

    class Cupon {
        +UUID id
        +string codigo
        +float porcentajeDescuento
        +date FIVigencia
        +date FFVigencia
        +float tope
    }

    class EventoStock {
        +UUID id
        +Date fecha
        +int cantidad
        +date timestamp
    }

    class VentaCliente {
    }

    class IngresoAuth {
        +string nombreAuth
        +float costoUnitario
    }

    class ExtraccionManual {
        +MotivoExtraccion motivo
        +string justificacion
    }

    class Producto {
        +UUID id
        +string skuBase
        +float precioVenta
        +string nombre
        +float costo
        +int stockActual
        +EstadoProducto estado
        +string garantia
    }

    class VarianteProducto {
        +UUID id
        +int talle
        +string color
        +string skuVariante
        +string material
    }

    class Categoria {
        +UUID id
        +string nombre
    }

    class EtiquetaUso {
        +UUID id
        +string disciplina
    }

    class Marca {
        +UUID id
        +string nombre
    }

    class Combo {
        +UUID id
        +string nombre
        +float precioCombo
    }

    class Visitante {
        +UUID SesionId
    }

    %% Jerarquías de Herencia
    Usuario <|-- AdminVentas
    Usuario <|-- Cliente
    EventoStock <|-- VentaCliente
    EventoStock <|-- IngresoAuth
    EventoStock <|-- ExtraccionManual

    %% Relaciones de Usuario / Cliente / Admin
    AdminVentas "1" --> "*" Pedido : Gestiona
    AdminVentas "1" --> "*" EventoStock : Registra
    Cliente "1" --> "*" Pedido : Realiza
    Cliente "1" --> "1" Carrito : Posee
    Cliente "1" --> "1..3" Direccion : Registra
    Cliente "*" --> "*" Cupon : Posee
    Cliente "*" --> "*" Producto : Marca como favorito a

    %% Pedido / Pago / Comprobante
    Pedido "1" *-- "1..*" ItemPedido : Contiene
    Pedido "1" --> "1" Pago : Requiere
    Pago "1" --> "1" Comprobante : Genera
    Pedido "1" --> "1" VentaCliente : Se asocia a

    %% Carrito / Cupon / Items
    Carrito "1" *-- "*" ItemCarrito : Contiene
    Carrito --> "0..1" Cupon : Aplica
    ItemCarrito "*" --> "1" Producto : Referencia a
    ItemPedido "*" --> "1" Producto : Corresponde a

    %% Catálogo y Producto
    Producto "1" *-- "1..*" VarianteProducto : Contiene
    Producto "*" --> "1" Categoria : Clasifica en
    Producto "*" --> "*" EtiquetaUso : Se asocia con
    Producto "*" --> "1" Marca : Pertenece
    Combo "1" *-- "1..*" Producto : incluye

    %% Eventos de Stock y Visitante
    EventoStock "*" --> "1" Producto : Afecta a
    Visitante "*" --> "*" Producto : Consulta
```

---

## 2. Análisis del Diagrama (Evaluación Crítica de Arquitectura)

Al contrastar este diagrama de clases con las buenas prácticas de arquitectura y las reglas de negocio de un E-Commerce con libro mayor inmutable, se identifican las siguientes observaciones:

### 1. `EventoStock` vs. `StockMovement` (Muy Bien Modelado)
* **Acierto:** Modelar los movimientos como una jerarquía polimórfica (`EventoStock` especializado en `VentaCliente`, `IngresoAuth` y `ExtraccionManual`) coincide conceptualmente con el patrón de **Libro Mayor (Append-Only Ledger)** requerido para auditoría.
* **Detalle a mejorar (Variantes vs. Producto Base):** En el diagrama, `EventoStock` apunta a `Producto`. No obstante, el stock físico en tiendas de indumentaria/calzado no existe en el producto abstracto, sino en la **`VarianteProducto`** (un talle o color específico). Es altamente recomendable que `EventoStock` afecte directamente a `VarianteProducto`.

### 2. Atributo `stockActual: int` en `Producto`
* **Observación crítica:** Si se prohíben las mutaciones directas sobre el inventario, `stockActual` **no debe ser un campo editable**. En su lugar, debe ser un valor calculado a partir de la suma de `EventoStock` (o una propiedad getter / vista materializada). Además, debería residir a nivel de `VarianteProducto` (el producto base sólo tendría la suma total).

### 3. Asociación de `ItemPedido` e `ItemCarrito`
* En el diagrama, ambos apuntan a `Producto`. Al existir `VarianteProducto` (con talle y color), cuando el cliente agrega un producto al carrito o realiza un pedido, debe seleccionar una **`VarianteProducto`** puntual para saber qué talle/color empaquetar y descontar del inventario.

### 4. Fortalezas Notables
* **Herencia de `Usuario`:** La separación de roles entre `Cliente` y `AdminVentas` permite modelar permisos y comportamientos especializados sin redundancia.
* **Regla de negocio `Direccion`:** La restricción `1..3` direcciones por cliente está explícitamente plasmada.
* **Ciclo de Orden y Pago:** El desacoplamiento entre `Pedido`, `Pago` y `Comprobante` permite soportar múltiples pasarelas (MercadoPago, Stripe) y estados asíncronos (`EstadoPago`).
* **Concepto de `Visitante`:** Permite carritos anónimos y métricas de interés antes del login.
