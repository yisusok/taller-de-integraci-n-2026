import { useState } from 'react';
import { MOVEMENT_LABELS, isUuidV4 } from './api';
import type { TipoMovimiento } from './api';
import { MovementList } from './MovementList';
import { useLedger } from './useLedger';
import { AdminPageHeading } from '../AdminLayout/AdminLayout';

const PAGE_SIZE = 30;

type TypeFilter = TipoMovimiento | 'ALL';

interface LedgerSectionProps {
  onSelectVariant: (varianteId: string) => void;
}

export function LedgerSection({ onSelectVariant }: LedgerSectionProps) {
  const [tipo, setTipo] = useState<TypeFilter>('ALL');
  const [varianteInput, setVarianteInput] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const varianteId = isUuidV4(varianteInput) ? varianteInput.trim() : undefined;
  const hasFilters = tipo !== 'ALL' || varianteInput.trim().length > 0;

  const ledger = useLedger({
    limit,
    tipo: tipo === 'ALL' ? undefined : tipo,
    varianteId,
  });

  const clearFilters = () => {
    setTipo('ALL');
    setVarianteInput('');
    setLimit(PAGE_SIZE);
  };

  const emptyMessage = ledger.loading
    ? 'Cargando movimientos…'
    : 'No hay movimientos que coincidan con los filtros.';

  return (
    <>
      <AdminPageHeading
        eyebrow="Administración / Inventario"
        title="Libro mayor de stock"
        subtitle="Auditoría completa e inmutable de ingresos, ventas y extracciones manuales."
      />

      <section className="admin-panel" aria-labelledby="stock-historial-title">
        <div className="admin-panel__header">
          <h2 id="stock-historial-title" className="admin-panel__title">
            Movimientos registrados
          </h2>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            disabled={ledger.loading}
            onClick={ledger.reload}
          >
            {ledger.loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="stock-filters">
          <div className="admin-field">
            <label htmlFor="ledger-variante" className="admin-field__label">
              Variante (UUID)
            </label>
            <input
              id="ledger-variante"
              className="admin-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Pegá un UUID para filtrar"
              value={varianteInput}
              onChange={(event) => {
                setVarianteInput(event.target.value);
                setLimit(PAGE_SIZE);
              }}
            />
            {varianteInput.trim().length > 0 && !varianteId && (
              <p className="admin-panel__helper">Ingresá el UUID completo para aplicar el filtro.</p>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="ledger-tipo" className="admin-field__label">
              Tipo de movimiento
            </label>
            <select
              id="ledger-tipo"
              className="admin-select"
              value={tipo}
              onChange={(event) => {
                setTipo(event.target.value as TypeFilter);
                setLimit(PAGE_SIZE);
              }}
            >
              <option value="ALL">Todos</option>
              {(Object.keys(MOVEMENT_LABELS) as TipoMovimiento[]).map((value) => (
                <option key={value} value={value}>
                  {MOVEMENT_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="stock-meta">
          <span>
            {ledger.movements.length} movimiento(s) · más recientes primero
          </span>
          {hasFilters && (
            <button type="button" className="admin-link" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        {ledger.error ? (
          <div className="admin-alert admin-alert--error" role="alert">
            {ledger.error}
          </div>
        ) : (
          <MovementList
            movements={ledger.movements}
            onSelectVariant={onSelectVariant}
            emptyMessage={emptyMessage}
            showUser
          />
        )}

        {!ledger.error && ledger.movements.length >= limit && (
          <button
            type="button"
            className="admin-btn admin-btn--secondary stock-more"
            disabled={ledger.loading}
            onClick={() => setLimit((current) => current + PAGE_SIZE)}
          >
            Ver más movimientos
          </button>
        )}
      </section>
    </>
  );
}
