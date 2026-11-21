import { MOVEMENT_LABELS, isUuidV4 } from './api';
import type { StockMovement, TipoMovimiento } from './api';

const PILL_BY_TYPE: Record<TipoMovimiento, string> = {
  INGRESO_PROVEEDOR: 'admin-pill--ok',
  VENTA: 'admin-pill--neutral',
  EXTRACCION_MANUAL: 'admin-pill--bad',
};

interface MovementListProps {
  movements: StockMovement[];
  onSelectVariant: (varianteId: string) => void;
  emptyMessage: string;
  showUser?: boolean;
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

export function MovementList({
  movements,
  onSelectVariant,
  emptyMessage,
  showUser = false,
}: MovementListProps) {
  if (movements.length === 0) {
    return <p className="admin-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="stock-list">
      {movements.map((movement) => {
        const isInbound = movement.tipo_movimiento === 'INGRESO_PROVEEDOR';
        return (
          <li key={movement.id} className="stock-row">
            <div className="stock-row__top">
              <span className={`admin-pill ${PILL_BY_TYPE[movement.tipo_movimiento]}`}>
                {MOVEMENT_LABELS[movement.tipo_movimiento]}
              </span>
              <span
                className={`stock-row__qty ${isInbound ? 'stock-row__qty--in' : 'stock-row__qty--out'}`}
              >
                {isInbound ? '+' : '−'}
                {movement.cantidad}
              </span>
            </div>
            <p className="stock-row__reason">{movement.motivo}</p>
            <div className="stock-row__meta">
              <span>{formatDate(movement.created_at)}</span>
              {showUser && movement.usuario_id && (
                <span>Responsable: {movement.usuario_id.slice(0, 8)}</span>
              )}
              {isUuidV4(movement.variante_id) && (
                <button
                  type="button"
                  className="stock-row__variant"
                  title="Usar esta variante en una extracción"
                  onClick={() => onSelectVariant(movement.variante_id)}
                >
                  Variante {movement.variante_id.slice(0, 8)}…
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
