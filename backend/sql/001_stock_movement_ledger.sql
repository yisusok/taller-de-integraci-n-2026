-- =============================================================================
-- Migración / Script SQL: Tabla StockMovement e Inmutabilidad en PostgreSQL
-- =============================================================================

-- 1. Crear tipo enumerado (o constraint CHECK) para los tipos de movimiento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimiento_enum') THEN
        CREATE TYPE tipo_movimiento_enum AS ENUM (
            'INGRESO_PROVEEDOR',
            'VENTA',
            'EXTRACCION_MANUAL'
        );
    END IF;
END$$;

-- 2. Crear tabla stock_movements (Libro mayor de existencias)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id UUID NOT NULL,
    tipo_movimiento tipo_movimiento_enum NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    motivo TEXT NOT NULL,
    usuario_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas de inventario por variante y orden temporal
CREATE INDEX IF NOT EXISTS idx_stock_movements_variante ON stock_movements (variante_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variante_fecha ON stock_movements (variante_id, created_at);

-- 3. Función y Trigger para PROHIBIR mutaciones directas (UPDATE y DELETE)
-- Esto garantiza a nivel de motor de base de datos que el historial es un append-only ledger inmutable.
CREATE OR REPLACE FUNCTION fn_prevent_stock_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación prohibida: La tabla stock_movements es un libro mayor inmutable (append-only). No se permiten operaciones de UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_stock_movement_mutation ON stock_movements;

CREATE TRIGGER trg_prevent_stock_movement_mutation
BEFORE UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_prevent_stock_movement_mutation();

-- 4. Vista de solo lectura para consultar existencias actuales consolidadas
CREATE OR REPLACE VIEW vista_existencias_actuales AS
SELECT
    variante_id,
    COALESCE(
        SUM(
            CASE 
                WHEN tipo_movimiento = 'INGRESO_PROVEEDOR' THEN cantidad
                WHEN tipo_movimiento IN ('VENTA', 'EXTRACCION_MANUAL') THEN -cantidad
                ELSE 0
            END
        ),
        0
    ) AS existencias_actuales,
    MAX(created_at) AS ultimo_movimiento
FROM stock_movements
GROUP BY variante_id;
