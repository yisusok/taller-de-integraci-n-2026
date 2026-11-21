import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MOTIVO_MIN_LENGTH, isUuidV4, stockApi } from './api';
import type { StockSummary } from './api';
import { MovementList } from './MovementList';
import { useLedger } from './useLedger';
import { AdminPageHeading } from '../AdminLayout/AdminLayout';

const MOTIVO_PRESETS = [
  'Rotura o falla de fábrica',
  'Merma detectada en depósito',
  'Devolución interna a proveedor',
  'Ajuste por conteo físico',
];

type Lookup =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: StockSummary };

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

interface ExtractionSectionProps {
  initialVarianteId?: string;
  onOpenLedger: () => void;
}

export function ExtractionSection({ initialVarianteId, onOpenLedger }: ExtractionSectionProps) {
  const [varianteId, setVarianteId] = useState(initialVarianteId ?? '');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [lookup, setLookup] = useState<Lookup>(() =>
    initialVarianteId && isUuidV4(initialVarianteId) ? { status: 'loading' } : { status: 'idle' },
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const recent = useLedger({ limit: 5 });

  useEffect(() => {
    if (!initialVarianteId || !isUuidV4(initialVarianteId)) return;

    let ignore = false;
    stockApi
      .getSummary(initialVarianteId.trim())
      .then((summary) => {
        if (!ignore) setLookup({ status: 'ready', summary });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setLookup({ status: 'error', message: messageOf(error, 'No se pudo consultar el saldo.') });
        }
      });

    return () => {
      ignore = true;
    };
  }, [initialVarianteId]);

  const runLookup = async (id: string) => {
    if (!isUuidV4(id)) {
      setLookup({ status: 'error', message: 'Ingresá un UUID versión 4 válido.' });
      return;
    }
    setLookup({ status: 'loading' });
    try {
      const summary = await stockApi.getSummary(id.trim());
      setLookup({ status: 'ready', summary });
    } catch (error) {
      setLookup({ status: 'error', message: messageOf(error, 'No se pudo consultar el saldo.') });
    }
  };

  const summary =
    lookup.status === 'ready' &&
      lookup.summary.variante_id.toLowerCase() === varianteId.trim().toLowerCase()
      ? lookup.summary
      : null;

  const quantity = Number.parseInt(cantidad, 10);
  const exceedsStock = summary !== null && Number.isInteger(quantity) && quantity > summary.existencias_actuales;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!isUuidV4(varianteId)) {
      setFormError('El ID de variante debe ser un UUID versión 4 válido.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (motivo.trim().length < MOTIVO_MIN_LENGTH) {
      setFormError(`El motivo es obligatorio (mínimo ${MOTIVO_MIN_LENGTH} caracteres).`);
      return;
    }
    if (exceedsStock && summary) {
      setFormError(
        `No podés extraer ${quantity} unidad(es): el saldo disponible es ${summary.existencias_actuales}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await stockApi.registerManualExtraction({
        variante_id: varianteId.trim(),
        cantidad: quantity,
        motivo: motivo.trim(),
      });
      setSuccess(`Extracción registrada: se descontaron ${created.cantidad} unidad(es) del stock.`);
      setCantidad('1');
      setMotivo('');
      recent.reload();
      await runLookup(varianteId);
    } catch (error) {
      setFormError(messageOf(error, 'No se pudo registrar la extracción.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setVarianteId('');
    setCantidad('1');
    setMotivo('');
    setLookup({ status: 'idle' });
    setFormError(null);
    setSuccess(null);
  };

  const loadVariant = (id: string) => {
    setVarianteId(id);
    setSuccess(null);
    setFormError(null);
    void runLookup(id);
  };

  return (
    <>
      <AdminPageHeading
        eyebrow="Administración / Inventario"
        title="Extracción manual"
        subtitle="Registrá bajas por merma, rotura o devolución interna. Cada registro es inmutable y actualiza el saldo calculado."
      />

      <div className="admin-grid">
        <form className="admin-stack" onSubmit={handleSubmit} noValidate>
          <section className="admin-panel" aria-labelledby="stock-saldo-title">
            <div>
              <h2 id="stock-saldo-title" className="admin-panel__title">
                Saldo de la variante
              </h2>
              <p className="admin-panel__helper">
                Consultá las existencias antes de registrar una baja.
              </p>
            </div>

            <div className="admin-field">
              <label htmlFor="stock-variante" className="admin-field__label">
                ID de variante (UUID)
              </label>
              <div className="admin-field__row">
                <input
                  id="stock-variante"
                  className="admin-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
                  value={varianteId}
                  onChange={(event) => setVarianteId(event.target.value)}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={lookup.status === 'loading' || varianteId.trim().length === 0}
                  onClick={() => void runLookup(varianteId)}
                >
                  {lookup.status === 'loading' ? 'Consultando…' : 'Consultar saldo'}
                </button>
              </div>
            </div>

            {lookup.status === 'error' && (
              <div className="admin-alert admin-alert--error" role="alert">
                {lookup.message}
              </div>
            )}

            {summary && (
              <>
                <dl className="stock-balance" aria-live="polite">
                  <div
                    className={`stock-balance__item stock-balance__item--main ${summary.existencias_actuales > 0 ? '' : 'stock-balance__item--empty'
                      }`}
                  >
                    <dt>Disponible</dt>
                    <dd>{summary.existencias_actuales}</dd>
                  </div>
                  <div className="stock-balance__item">
                    <dt>Ingresos</dt>
                    <dd>{summary.total_ingresos}</dd>
                  </div>
                  <div className="stock-balance__item">
                    <dt>Ventas</dt>
                    <dd>{summary.total_ventas}</dd>
                  </div>
                  <div className="stock-balance__item">
                    <dt>Extracciones</dt>
                    <dd>{summary.total_extracciones_manuales}</dd>
                  </div>
                </dl>
                <p className="stock-balance__state">
                  <span
                    className={`admin-pill ${summary.existencias_actuales > 0 ? 'admin-pill--ok' : 'admin-pill--bad'}`}
                  >
                    {summary.existencias_actuales > 0 ? 'Con stock' : 'Sin stock'}
                  </span>
                </p>
              </>
            )}
          </section>

          <section className="admin-panel" aria-labelledby="stock-datos-title">
            <h2 id="stock-datos-title" className="admin-panel__title">
              Datos de la extracción
            </h2>

            <div className="admin-field">
              <label htmlFor="stock-cantidad" className="admin-field__label">
                Cantidad a extraer
              </label>
              <input
                id="stock-cantidad"
                className="admin-input"
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="stock-motivo" className="admin-field__label">
                Motivo
              </label>
              <textarea
                id="stock-motivo"
                className="admin-textarea"
                placeholder="Describí por qué se retira esta mercadería"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />
              <div className="admin-chips">
                {MOTIVO_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="admin-chip"
                    onClick={() => setMotivo(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {exceedsStock && summary && (
              <div className="admin-alert admin-alert--warning" role="alert">
                La cantidad ({quantity}) supera el saldo disponible ({summary.existencias_actuales}).
              </div>
            )}
            {formError && (
              <div className="admin-alert admin-alert--error" role="alert">
                {formError}
              </div>
            )}
            {success && (
              <div className="admin-alert admin-alert--success" role="status">
                {success}
              </div>
            )}

            <div className="admin-actions">
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={submitting || exceedsStock}
              >
                {submitting ? 'Registrando…' : 'Registrar extracción'}
              </button>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={resetForm}>
                Limpiar
              </button>
            </div>
          </section>
        </form>

        <section className="admin-panel" aria-labelledby="stock-recientes-title">
          <div className="admin-panel__header">
            <div>
              <h2 id="stock-recientes-title" className="admin-panel__title">
                Últimos movimientos
              </h2>
              <p className="admin-panel__helper">Elegí una variante para cargar su saldo.</p>
            </div>
            <button type="button" className="admin-link" onClick={onOpenLedger}>
              Ver historial completo
            </button>
          </div>

          {recent.error ? (
            <div className="admin-alert admin-alert--error" role="alert">
              {recent.error}
            </div>
          ) : (
            <MovementList
              movements={recent.movements}
              onSelectVariant={loadVariant}
              emptyMessage={recent.loading ? 'Cargando movimientos…' : 'Todavía no hay movimientos registrados.'}
            />
          )}
        </section>
      </div>
    </>
  );
}
