import { useState } from 'react';
import type { FormEvent } from 'react';
import { stockApi } from '../Stock/api';
import { SHOE_SIZE_PRESETS, catalogApi, messageFromError } from './api';
import type { Producto, Variante } from './api';

interface ProductVariantsPanelProps {
  product: Producto;
  onRefresh: () => Promise<void>;
  onOpenExtraction: (varianteId: string) => void;
  onOpenLedger: (varianteId: string) => void;
  onStockMutated?: () => void;
}

export function ProductVariantsPanel({
  product,
  onRefresh,
  onOpenExtraction,
  onOpenLedger,
  onStockMutated,
}: ProductVariantsPanelProps) {
  const [talle, setTalle] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [skuVariante, setSkuVariante] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);

  const [entryVariantId, setEntryVariantId] = useState<string | null>(null);
  const [entryCantidad, setEntryCantidad] = useState('10');
  const [entryMotivo, setEntryMotivo] = useState('Recepción de mercadería');
  const [savingEntry, setSavingEntry] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelSuccess, setPanelSuccess] = useState<string | null>(null);

  const handleCopyUuid = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {}
  };

  const handleAddVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPanelError(null);
    setPanelSuccess(null);

    if (!talle.trim() || !color.trim()) {
      setPanelError('Ingresá talle y color para agregar la variante.');
      return;
    }

    setAddingVariant(true);
    try {
      await catalogApi.createVariant({
        producto_id: product.id,
        talle: talle.trim(),
        color: color.trim(),
        material: material.trim() || undefined,
        sku_variante: skuVariante.trim() || undefined,
      });
      setTalle('');
      setColor('');
      setMaterial('');
      setSkuVariante('');
      setPanelSuccess('Variante agregada al producto.');
      await onRefresh();
      onStockMutated?.();
    } catch (err) {
      setPanelError(messageFromError(err, 'No se pudo crear la variante.'));
    } finally {
      setAddingVariant(false);
    }
  };

  const handleSupplierEntry = async (
    event: FormEvent<HTMLFormElement>,
    variante: Variante,
  ) => {
    event.preventDefault();
    setPanelError(null);
    setPanelSuccess(null);

    const cantidad = Number.parseInt(entryCantidad, 10);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setPanelError('La cantidad a ingresar debe ser un entero mayor a 0.');
      return;
    }
    const cleanMotivo = entryMotivo.trim();
    if (!cleanMotivo) {
      setPanelError('Ingresá una nota o referencia para el ingreso de stock.');
      return;
    }

    setSavingEntry(true);
    try {
      await stockApi.registerSupplierEntry({
        variante_id: variante.id,
        cantidad,
        motivo: cleanMotivo,
      });
      setEntryVariantId(null);
      setEntryCantidad('10');
      setEntryMotivo('Recepción de mercadería');
      setPanelSuccess(
        `Ingreso registrado en el libro mayor (+${cantidad} u. en talle ${variante.talle} ${variante.color}).`,
      );
      await onRefresh();
      onStockMutated?.();
    } catch (err) {
      setPanelError(messageFromError(err, 'No se pudo registrar el ingreso de stock.'));
    } finally {
      setSavingEntry(false);
    }
  };

  const handleToggleVariant = async (v: Variante) => {
    setBusyId(v.id);
    setPanelError(null);
    try {
      await catalogApi.updateVariant(v.id, { activa: !v.activa });
      await onRefresh();
      onStockMutated?.();
    } catch (err) {
      setPanelError(messageFromError(err, 'No se pudo actualizar la variante.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteVariant = async (id: string) => {
    setBusyId(id);
    setPanelError(null);
    setPanelSuccess(null);
    try {
      await catalogApi.deleteVariant(id);
      setConfirmDeleteId(null);
      setPanelSuccess('Variante eliminada.');
      await onRefresh();
      onStockMutated?.();
    } catch (err) {
      setPanelError(messageFromError(err, 'No se pudo eliminar la variante.'));
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="catalog-variants-panel">
      <div className="catalog-variants-panel__header">
        <strong>Variantes de {product.nombre}</strong>
        <span className="admin-panel__helper">
          Cada ingreso o egreso genera un movimiento inmutable en el libro mayor.
        </span>
      </div>

      {panelError && (
        <div className="admin-alert admin-alert--error" role="alert">
          {panelError}
        </div>
      )}
      {panelSuccess && (
        <div className="admin-alert admin-alert--success" role="status">
          {panelSuccess}
        </div>
      )}

      {product.variantes.length === 0 ? (
        <p className="admin-empty">Este producto todavía no tiene variantes cargadas.</p>
      ) : (
        <div className="catalog-variants-list">
          {product.variantes.map((v) => {
            const isBusy = busyId === v.id;
            const isEntering = entryVariantId === v.id;
            const isConfirming = confirmDeleteId === v.id;

            return (
              <div key={v.id} className="catalog-variant-item">
                <div className="catalog-variant-item__top">
                  <div className="catalog-variant-item__info">
                    <span className="catalog-variant-badge">Talle {v.talle}</span>
                    <strong>{v.color}</strong>
                    {v.material && <span className="catalog-muted">· {v.material}</span>}
                    {v.sku_variante && (
                      <code className="catalog-sku-code">{v.sku_variante}</code>
                    )}
                    <span className={`admin-pill ${v.activa ? 'admin-pill--ok' : 'admin-pill--bad'}`}>
                      {v.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    <span
                      className={`admin-pill ${v.stock_actual > 0 ? 'admin-pill--ok' : 'admin-pill--bad'}`}
                    >
                      {v.stock_actual > 0 ? `${v.stock_actual} u. disponibles` : 'Sin stock'}
                    </span>
                  </div>

                  <div className="catalog-variant-item__uuid">
                    <code className="catalog-uuid-text">{v.id}</code>
                    <button
                      type="button"
                      className="catalog-copy-btn"
                      onClick={() => void handleCopyUuid(v.id)}
                    >
                      {copiedId === v.id ? '✓ Copiado' : 'Copiar UUID'}
                    </button>
                  </div>
                </div>

                <div className="catalog-variant-item__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary catalog-btn-sm"
                    onClick={() => setEntryVariantId(isEntering ? null : v.id)}
                    disabled={isBusy}
                  >
                    + Ingresar stock
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary catalog-btn-sm"
                    onClick={() => onOpenExtraction(v.id)}
                    disabled={v.stock_actual <= 0 || isBusy}
                  >
                    Extraer
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary catalog-btn-sm"
                    onClick={() => onOpenLedger(v.id)}
                    disabled={isBusy}
                  >
                    Ledger
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary catalog-btn-sm"
                    onClick={() => void handleToggleVariant(v)}
                    disabled={isBusy}
                  >
                    {v.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  {isConfirming ? (
                    <div className="catalog-confirm-inline">
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary catalog-btn-sm"
                        onClick={() => void handleDeleteVariant(v.id)}
                        disabled={isBusy}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isBusy}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary catalog-btn-sm"
                      onClick={() => setConfirmDeleteId(v.id)}
                      disabled={isBusy}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                {isEntering && (
                  <form
                    className="catalog-entry-form"
                    onSubmit={(e) => void handleSupplierEntry(e, v)}
                    noValidate
                  >
                    <div className="catalog-entry-form__fields">
                      <div className="admin-field">
                        <label className="admin-field__label">Cantidad (+)</label>
                        <input
                          className="admin-input"
                          type="number"
                          min={1}
                          step={1}
                          value={entryCantidad}
                          onChange={(e) => setEntryCantidad(e.target.value)}
                        />
                      </div>
                      <div className="admin-field catalog-entry-form__motivo">
                        <label className="admin-field__label">Motivo / referencia</label>
                        <input
                          className="admin-input"
                          type="text"
                          value={entryMotivo}
                          onChange={(e) => setEntryMotivo(e.target.value)}
                          placeholder="Ej. Reposición lote #14"
                        />
                      </div>
                    </div>
                    <div className="catalog-entry-form__actions">
                      <button
                        type="submit"
                        className="admin-btn admin-btn--primary catalog-btn-sm"
                        disabled={savingEntry}
                      >
                        {savingEntry ? 'Registrando…' : 'Confirmar ingreso'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => setEntryVariantId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form className="catalog-add-variant-form" onSubmit={handleAddVariant} noValidate>
        <p className="catalog-add-variant-form__title">+ Agregar variante</p>
        <div className="admin-chips">
          {SHOE_SIZE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="admin-chip"
              onClick={() => setTalle(preset)}
            >
              Talle {preset}
            </button>
          ))}
        </div>
        <div className="catalog-add-variant-form__grid">
          <input
            className="admin-input"
            type="text"
            placeholder="Talle (ej. 41)"
            value={talle}
            onChange={(e) => setTalle(e.target.value)}
          />
          <input
            className="admin-input"
            type="text"
            placeholder="Color (ej. Negro)"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <input
            className="admin-input"
            type="text"
            placeholder="Material (opcional)"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
          <input
            className="admin-input"
            type="text"
            placeholder="SKU variante (opcional)"
            value={skuVariante}
            onChange={(e) => setSkuVariante(e.target.value)}
          />
          <button
            type="submit"
            className="admin-btn admin-btn--primary catalog-btn-sm"
            disabled={addingVariant}
          >
            {addingVariant ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </div>
  );
}
