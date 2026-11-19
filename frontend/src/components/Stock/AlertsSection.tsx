import { useEffect, useState } from 'react';
import { AdminPageHeading } from '../AdminLayout/AdminLayout';
import { stockApi } from './api';
import type { LowStockAlert, LowStockAlertsResponse, NivelAlertaStock } from './api';

interface AlertsSectionProps {
  onSelectExtraction: (varianteId: string) => void;
  onSelectLedger: (varianteId: string) => void;
  onAlertCountChange?: (count: number) => void;
}

const THRESHOLD_OPTIONS = [3, 5, 10, 15];

const LEVEL_LABELS: Record<NivelAlertaStock, string> = {
  agotado: 'Agotado (0)',
  critico: 'Crítico',
  bajo: 'Stock bajo',
};

export function AlertsSection({
  onSelectExtraction,
  onSelectLedger,
  onAlertCountChange,
}: AlertsSectionProps) {
  const [threshold, setThreshold] = useState<number>(5);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<LowStockAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    stockApi
      .getAlerts(threshold)
      .then((response) => {
        if (ignore) return;
        setData(response);
        setError(null);
        onAlertCountChange?.(response.total_alertas);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las alertas de stock.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [threshold, reloadKey, onAlertCountChange]);

  const triggerReload = (nextThreshold: number) => {
    setLoading(true);
    setError(null);
    setThreshold(nextThreshold);
    setReloadKey((k) => k + 1);
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
    }
  };

  const countBy = (level: NivelAlertaStock): number =>
    data?.alertas.filter((a) => a.nivel === level).length ?? 0;

  return (
    <div className="admin-stack">
      <AdminPageHeading
        eyebrow="Administración / Inventario"
        title="Alertas de stock bajo"
        subtitle="Monitoreo de variantes con existencias agotadas o próximas al punto de reposición."
      />

      <section className="admin-panel stock-alerts-toolbar">
        <div className="stock-alerts-toolbar__left">
          <span className="stock-alerts-toolbar__label">Umbral de reposición:</span>
          <div className="stock-alerts-toolbar__pills">
            {THRESHOLD_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`stock-threshold-pill ${threshold === opt ? 'stock-threshold-pill--active' : ''}`}
                onClick={() => triggerReload(opt)}
              >
                ≤ {opt} un.
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn--secondary stock-alerts-refresh"
          onClick={() => triggerReload(threshold)}
          disabled={loading}
        >
          {loading ? 'Actualizando…' : '↻ Actualizar'}
        </button>
      </section>

      {data && (
        <div className="stock-metrics-grid">
          <div className="stock-metric-card">
            <span className="stock-metric-card__label">Total en alerta</span>
            <span className="stock-metric-card__value stock-metric-card__value--alert">
              {data.total_alertas}
            </span>
            <span className="stock-metric-card__hint">Variantes con existencias ≤ {threshold}</span>
          </div>

          <div className="stock-metric-card">
            <span className="stock-metric-card__label">Agotadas</span>
            <span className="stock-metric-card__value stock-metric-card__value--danger">
              {countBy('agotado')}
            </span>
            <span className="stock-metric-card__hint">Sin existencias disponibles</span>
          </div>

          <div className="stock-metric-card">
            <span className="stock-metric-card__label">Estado crítico</span>
            <span className="stock-metric-card__value stock-metric-card__value--warning">
              {countBy('critico')}
            </span>
            <span className="stock-metric-card__hint">Próximo a quiebre de stock</span>
          </div>

          <div className="stock-metric-card">
            <span className="stock-metric-card__label">Stock bajo</span>
            <span className="stock-metric-card__value">
              {countBy('bajo')}
            </span>
            <span className="stock-metric-card__hint">Requiere reposición programada</span>
          </div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-panel">
        <h2 className="admin-panel__title">Variantes que requieren atención</h2>
        <p className="admin-panel__helper">
          Mostrando variantes cuyas existencias actuales se encuentran en o por debajo del umbral de {threshold} unidades.
        </p>

        {loading && !data && (
          <div className="admin-empty">Consultando alertas de inventario…</div>
        )}

        {data && data.alertas.length === 0 && (
          <div className="stock-alerts-empty">
            <div className="stock-alerts-empty__icon">✓</div>
            <p className="stock-alerts-empty__title">Sin alertas de stock bajo</p>
            <p className="stock-alerts-empty__desc">
              Todas las variantes registradas superan el umbral de reposición de {threshold} unidades.
            </p>
          </div>
        )}

        {data && data.alertas.length > 0 && (
          <div className="stock-alerts-list">
            {data.alertas.map((item: LowStockAlert) => {
              const pct = Math.min(100, Math.round((Math.max(0, item.existencias_actuales) / threshold) * 100));

              return (
                <article key={item.variante_id} className={`stock-alert-item stock-alert-item--${item.nivel}`}>
                  <div className="stock-alert-item__header">
                    <span className={`stock-alert-badge stock-alert-badge--${item.nivel}`}>
                      {LEVEL_LABELS[item.nivel]}
                    </span>

                    <div className="stock-alert-item__stock">
                      <span className="stock-alert-item__stock-num">{item.existencias_actuales}</span>
                      <span className="stock-alert-item__stock-threshold">/ {threshold} un.</span>
                    </div>
                  </div>

                  <div className="stock-alert-bar">
                    <div
                      className={`stock-alert-bar__fill stock-alert-bar__fill--${item.nivel}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="stock-alert-item__body">
                    {item.producto_nombre && (
                      <div className="stock-alert-item__id-row">
                        <strong>{item.producto_nombre}</strong>
                        {(item.talle || item.color) && (
                          <span>
                            · Talle {item.talle ?? '—'} · {item.color ?? ''}
                          </span>
                        )}
                        {item.sku_variante && (
                          <code className="stock-alert-item__code">{item.sku_variante}</code>
                        )}
                      </div>
                    )}
                    <div className="stock-alert-item__id-row">
                      <span className="stock-alert-item__id-label">Variante ID:</span>
                      <code className="stock-alert-item__code">{item.variante_id}</code>
                      <button
                        type="button"
                        className="stock-alert-copy-btn"
                        onClick={() => void handleCopy(item.variante_id)}
                        title="Copiar ID de variante"
                      >
                        {copiedId === item.variante_id ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>

                    <div className="stock-alert-item__stats">
                      <span>Ingresos históricos: <strong>{item.total_ingresos}</strong></span>
                      <span>·</span>
                      <span>Salidas totales: <strong>{item.total_salidas}</strong></span>
                    </div>
                  </div>

                  <div className="stock-alert-item__actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary stock-alert-btn"
                      onClick={() => onSelectLedger(item.variante_id)}
                    >
                      Ver libro mayor
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary stock-alert-btn"
                      onClick={() => onSelectExtraction(item.variante_id)}
                      disabled={item.existencias_actuales <= 0}
                    >
                      {item.existencias_actuales <= 0 ? 'Sin saldo' : 'Extraer stock'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
