import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminPageHeading } from '../AdminLayout/AdminLayout';
import { ProductVariantsPanel } from './ProductVariantsPanel';
import {
  SHOE_SIZE_PRESETS,
  SPORT_TAG_PRESETS,
  catalogApi,
  formatArs,
  messageFromError,
} from './api';
import type { Categoria, InitialVarianteInput, Producto } from './api';
import './Catalog.css';

interface ProductsSectionProps {
  onOpenExtraction: (varianteId: string) => void;
  onOpenLedger: (varianteId: string) => void;
  onGoToCategories: () => void;
  onStockMutated?: () => void;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const USE_PRESETS = [
  'Running en asfalto',
  'Básquet indoor',
  'Uso urbano diario',
  'Entrenamiento / Gym',
];

const parseTagsInput = (raw: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const clean = part.trim().toLowerCase();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
};

export function ProductsSection({
  onOpenExtraction,
  onOpenLedger,
  onGoToCategories,
  onStockMutated,
}: ProductsSectionProps) {
  const [products, setProducts] = useState<Producto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageLimit, setPageLimit] = useState(24);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precio, setPrecio] = useState('');
  const [costo, setCosto] = useState('');
  const [garantia, setGarantia] = useState('');
  const [usoRecomendado, setUsoRecomendado] = useState('');
  const [etiquetasInput, setEtiquetasInput] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [initialVariants, setInitialVariants] = useState<InitialVarianteInput[]>([]);
  const [draftTalle, setDraftTalle] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [draftMaterial, setDraftMaterial] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const activoParam =
        statusFilter === 'ACTIVE'
          ? 'true'
          : statusFilter === 'INACTIVE'
            ? 'false'
            : undefined;
      const [prods, cats] = await Promise.all([
        catalogApi.listAdminProducts({
          search: search || undefined,
          categoria_id: categoryFilter || undefined,
          activo: activoParam,
          limit: pageLimit,
        }),
        catalogApi.listAdminCategories(),
      ]);
      setProducts(prods.items);
      setTotalProducts(prods.total);
      setCategories(cats);
    } catch (err) {
      setListError(messageFromError(err, 'No se pudo cargar el catálogo de productos.'));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, pageLimit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setSku('');
    setNombre('');
    setMarca('');
    setCategoriaId(categories[0]?.id ?? '');
    setPrecio('');
    setCosto('');
    setGarantia('');
    setUsoRecomendado('');
    setEtiquetasInput('');
    setImagenUrl('');
    setDescripcion('');
    setActivo(true);
    setInitialVariants([]);
    setDraftTalle('');
    setDraftColor('');
    setDraftMaterial('');
    setFormError(null);
  };

  const openCreateForm = () => {
    resetForm();
    setFormSuccess(null);
    setFormOpen(true);
  };

  const startEdit = (prod: Producto) => {
    setEditingId(prod.id);
    setSku(prod.sku);
    setNombre(prod.nombre);
    setMarca(prod.marca);
    setCategoriaId(prod.categoria_id);
    setPrecio(String(prod.precio));
    setCosto(String(prod.costo ?? 0));
    setGarantia(prod.garantia ?? '');
    setUsoRecomendado(prod.uso_recomendado ?? '');
    setEtiquetasInput((prod.etiquetas ?? []).join(', '));
    setImagenUrl(prod.imagen_url ?? '');
    setDescripcion(prod.descripcion ?? '');
    setActivo(prod.activo ?? true);
    setInitialVariants([]);
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
  };

  const toggleTagChip = (tag: string) => {
    const current = parseTagsInput(etiquetasInput);
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setEtiquetasInput(next.join(', '));
  };

  const addDraftVariant = () => {
    const cleanTalle = draftTalle.trim();
    const cleanColor = draftColor.trim();
    if (!cleanTalle || !cleanColor) {
      setFormError('Para añadir una variante inicial completá talle y color.');
      return;
    }
    const duplicated = initialVariants.some(
      (v) =>
        v.talle.toLowerCase() === cleanTalle.toLowerCase() &&
        v.color.toLowerCase() === cleanColor.toLowerCase(),
    );
    if (duplicated) {
      setFormError(`La variante talle "${cleanTalle}" y color "${cleanColor}" ya está en la lista.`);
      return;
    }
    setFormError(null);
    setInitialVariants((prev) => [
      ...prev,
      {
        talle: cleanTalle,
        color: cleanColor,
        material: draftMaterial.trim() || undefined,
      },
    ]);
    setDraftTalle('');
    setDraftColor('');
    setDraftMaterial('');
  };

  const parsedPrecio = Number.parseFloat(precio);
  const parsedCosto = Number.parseFloat(costo);
  const hasValidMargin =
    Number.isFinite(parsedPrecio) &&
    Number.isFinite(parsedCosto) &&
    parsedPrecio > 0 &&
    parsedCosto >= 0;
  const marginPct = hasValidMargin
    ? Math.round(((parsedPrecio - parsedCosto) / parsedPrecio) * 100)
    : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!sku.trim() || nombre.trim().length < 2 || !marca.trim() || !categoriaId) {
      setFormError('SKU base, nombre (mín. 2 caracteres), marca y categoría son obligatorios.');
      return;
    }
    if (!Number.isFinite(parsedPrecio) || parsedPrecio < 0 || !Number.isFinite(parsedCosto) || parsedCosto < 0) {
      setFormError('Precio de venta y costo deben ser números válidos mayores o iguales a 0.');
      return;
    }

    const etiquetas = parseTagsInput(etiquetasInput);
    setSubmitting(true);
    try {
      if (editingId) {
        await catalogApi.updateProduct(editingId, {
          sku: sku.trim(),
          nombre: nombre.trim(),
          marca: marca.trim(),
          categoria_id: categoriaId,
          precio: parsedPrecio,
          costo: parsedCosto,
          garantia: garantia.trim(),
          uso_recomendado: usoRecomendado.trim(),
          etiquetas,
          imagen_url: imagenUrl.trim(),
          descripcion: descripcion.trim(),
          activo,
        });
        setFormSuccess(`Producto "${nombre.trim()}" actualizado.`);
      } else {
        const created = await catalogApi.createProduct({
          sku: sku.trim(),
          nombre: nombre.trim(),
          marca: marca.trim(),
          categoria_id: categoriaId,
          precio: parsedPrecio,
          costo: parsedCosto,
          garantia: garantia.trim() || undefined,
          uso_recomendado: usoRecomendado.trim() || undefined,
          etiquetas,
          imagen_url: imagenUrl.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          activo,
          variantes: initialVariants.length > 0 ? initialVariants : undefined,
        });
        setFormSuccess(`Producto "${created.nombre}" creado correctamente.`);
        setExpandedProductId(created.id);
        if (initialVariants.length > 0) {
          onStockMutated?.();
        }
      }
      resetForm();
      setFormOpen(false);
      await loadData();
    } catch (err) {
      setFormError(messageFromError(err, 'No se pudo guardar el producto.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (prod: Producto) => {
    setBusyRowId(prod.id);
    setListError(null);
    try {
      await catalogApi.updateProduct(prod.id, { activo: !prod.activo });
      await loadData();
      onStockMutated?.();
    } catch (err) {
      setListError(messageFromError(err, 'No se pudo actualizar el estado del producto.'));
    } finally {
      setBusyRowId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyRowId(id);
    setListError(null);
    try {
      await catalogApi.deleteProduct(id);
      setConfirmDeleteId(null);
      if (expandedProductId === id) setExpandedProductId(null);
      await loadData();
      onStockMutated?.();
    } catch (err) {
      setListError(messageFromError(err, 'No se pudo eliminar el producto.'));
      setConfirmDeleteId(null);
    } finally {
      setBusyRowId(null);
    }
  };

  const activeTags = parseTagsInput(etiquetasInput);

  return (
    <div className="admin-stack">
      <AdminPageHeading
        eyebrow="Administración / Catálogo"
        title="Productos y variantes"
        subtitle="Gestioná la ficha técnica, etiquetas de uso y variantes por talle y color. El stock se actualiza únicamente mediante eventos del libro mayor."
      />

      {!loading && categories.length === 0 && (
        <div className="admin-alert admin-alert--warning catalog-banner-link">
          <span>Primero creá al menos una categoría para poder dar de alta productos.</span>
          <button type="button" className="admin-link" onClick={onGoToCategories}>
            Ir a Categorías →
          </button>
        </div>
      )}

      {formSuccess && (
        <div className="admin-alert admin-alert--success" role="status">
          {formSuccess}
        </div>
      )}

      <section className="admin-panel catalog-toolbar">
        <div className="catalog-toolbar__filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Buscar por nombre, SKU, marca o uso/deporte…"
            value={search}
            onChange={(e) => {
              setPageLimit(24);
              setSearch(e.target.value);
            }}
          />
          <select
            className="admin-select"
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => {
              setPageLimit(24);
              setCategoryFilter(e.target.value);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setPageLimit(24);
              setStatusFilter(e.target.value as StatusFilter);
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Solo activos</option>
            <option value="INACTIVE">Solo inactivos</option>
          </select>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={formOpen ? () => setFormOpen(false) : openCreateForm}
          disabled={categories.length === 0 && !formOpen}
        >
          {formOpen ? 'Cerrar formulario' : '+ Nuevo producto'}
        </button>
      </section>

      {formOpen && (
        <form className="admin-panel" onSubmit={handleSubmit} noValidate>
          <div className="admin-panel__header">
            <div>
              <h2 className="admin-panel__title">
                {editingId ? 'Editar ficha de producto' : 'Alta de producto'}
              </h2>
              <p className="admin-panel__helper">
                Completá los datos comerciales y etiquetas recomendadas para el asistente de búsqueda.
              </p>
            </div>
            {marginPct !== null && (
              <span className="admin-pill admin-pill--neutral">
                Margen bruto: {formatArs(parsedPrecio - parsedCosto)} ({marginPct}%)
              </span>
            )}
          </div>

          <div className="catalog-form-grid">
            <div className="admin-field">
              <label htmlFor="prod-sku" className="admin-field__label">
                SKU base *
              </label>
              <input
                id="prod-sku"
                className="admin-input"
                type="text"
                placeholder="SNK-RUN-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-nombre" className="admin-field__label">
                Nombre *
              </label>
              <input
                id="prod-nombre"
                className="admin-input"
                type="text"
                placeholder="Zapatillas Runner Pro"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-marca" className="admin-field__label">
                Marca *
              </label>
              <input
                id="prod-marca"
                className="admin-input"
                type="text"
                placeholder="Ej. Sneackers Lab"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-cat" className="admin-field__label">
                Categoría *
              </label>
              <select
                id="prod-cat"
                className="admin-select"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="">Seleccioná categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="prod-precio" className="admin-field__label">
                Precio de venta ($) *
              </label>
              <input
                id="prod-precio"
                className="admin-input"
                type="number"
                min={0}
                step="0.01"
                placeholder="79999"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-costo" className="admin-field__label">
                Costo ($) *
              </label>
              <input
                id="prod-costo"
                className="admin-input"
                type="number"
                min={0}
                step="0.01"
                placeholder="42000"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-garantia" className="admin-field__label">
                Garantía
              </label>
              <input
                id="prod-garantia"
                className="admin-input"
                type="text"
                placeholder="Ej. 6 meses por fallas de fabricación"
                value={garantia}
                onChange={(e) => setGarantia(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="prod-imagen" className="admin-field__label">
                URL de imagen (opcional)
              </label>
              <input
                id="prod-imagen"
                className="admin-input"
                type="url"
                placeholder="https://..."
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="prod-uso" className="admin-field__label">
              Uso recomendado (asistente de búsqueda)
            </label>
            <input
              id="prod-uso"
              className="admin-input"
              type="text"
              placeholder="Ej. Running en asfalto, entrenamiento diario"
              value={usoRecomendado}
              onChange={(e) => setUsoRecomendado(e.target.value)}
            />
            <div className="admin-chips">
              {USE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="admin-chip"
                  onClick={() => setUsoRecomendado(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="prod-tags" className="admin-field__label">
              Etiquetas de deporte / ocasión (separadas por coma)
            </label>
            <input
              id="prod-tags"
              className="admin-input"
              type="text"
              placeholder="running, asfalto, liviano"
              value={etiquetasInput}
              onChange={(e) => setEtiquetasInput(e.target.value)}
            />
            <div className="admin-chips">
              {SPORT_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`admin-chip ${activeTags.includes(tag) ? 'catalog-chip--selected' : ''}`}
                  onClick={() => toggleTagChip(tag)}
                >
                  {activeTags.includes(tag) ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="prod-desc" className="admin-field__label">
              Descripción
            </label>
            <textarea
              id="prod-desc"
              className="admin-textarea"
              placeholder="Detalles de amortiguación, suela, horma y cuidados…"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <label className="catalog-checkbox">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <span>Producto activo en el catálogo</span>
          </label>

          {!editingId && (
            <div className="catalog-draft-variants">
              <div className="catalog-draft-variants__header">
                <strong>Variantes iniciales (opcional)</strong>
                <span className="admin-panel__helper">
                  Podés definir talles y colores ahora o agregarlos luego.
                </span>
              </div>

              <div className="admin-chips">
                {SHOE_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="admin-chip"
                    onClick={() => setDraftTalle(preset)}
                  >
                    Talle {preset}
                  </button>
                ))}
              </div>

              <div className="catalog-draft-variants__inputs">
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Talle"
                  value={draftTalle}
                  onChange={(e) => setDraftTalle(e.target.value)}
                />
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Color"
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                />
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Material (opc.)"
                  value={draftMaterial}
                  onChange={(e) => setDraftMaterial(e.target.value)}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary catalog-btn-sm"
                  onClick={addDraftVariant}
                >
                  + Añadir fila
                </button>
              </div>

              {initialVariants.length > 0 && (
                <div className="catalog-draft-tags">
                  {initialVariants.map((item, idx) => (
                    <span key={`${item.talle}-${item.color}-${idx}`} className="admin-pill admin-pill--neutral">
                      Talle {item.talle} · {item.color}
                      {item.material ? ` (${item.material})` : ''}
                      <button
                        type="button"
                        className="catalog-pill-remove"
                        onClick={() =>
                          setInitialVariants((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label="Quitar variante inicial"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="admin-alert admin-alert--error" role="alert">
              {formError}
            </div>
          )}

          <div className="admin-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting
                ? 'Guardando…'
                : editingId
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="admin-panel" aria-labelledby="prod-list-title">
        <div className="admin-panel__header">
          <div>
            <h2 id="prod-list-title" className="admin-panel__title">
              Listado de productos ({products.length} de {totalProducts})
            </h2>
            <p className="admin-panel__helper">
              Desplegá &ldquo;Variantes&rdquo; en cualquier producto para cargar ingresos de mercadería o auditar su stock.
            </p>
          </div>
          <button
            type="button"
            className="admin-link"
            onClick={() => void loadData()}
            disabled={loading}
          >
            {loading ? 'Actualizando…' : '↻ Actualizar'}
          </button>
        </div>

        {listError && (
          <div className="admin-alert admin-alert--error" role="alert">
            {listError}
          </div>
        )}

        {loading && products.length === 0 ? (
          <p className="admin-empty">Cargando productos…</p>
        ) : products.length === 0 ? (
          <p className="admin-empty">
            No se encontraron productos que coincidan con los filtros actuales.
          </p>
        ) : (
          <div className="catalog-list">
            {products.map((prod) => {
              const isExpanded = expandedProductId === prod.id;
              const isBusy = busyRowId === prod.id;
              const confirming = confirmDeleteId === prod.id;
              const prodCosto = prod.costo ?? 0;
              const prodMargin =
                prod.precio > 0
                  ? Math.round(((prod.precio - prodCosto) / prod.precio) * 100)
                  : 0;

              return (
                <article key={prod.id} className="catalog-product-card">
                  <div className="catalog-product-card__head">
                    <div className="catalog-product-card__meta">
                      <div className="catalog-row__title-line">
                        <code className="catalog-sku-code">{prod.sku}</code>
                        <strong className="catalog-product-card__name">{prod.nombre}</strong>
                        <span className="catalog-muted">· {prod.marca}</span>
                      </div>

                      <div className="catalog-row__pills">
                        <span className="admin-pill admin-pill--neutral">
                          {prod.categoria?.nombre ?? 'Sin categoría'}
                        </span>
                        <span className={`admin-pill ${prod.activo ? 'admin-pill--ok' : 'admin-pill--bad'}`}>
                          {prod.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span
                          className={`admin-pill ${prod.stock_total > 0 ? 'admin-pill--ok' : 'admin-pill--bad'}`}
                        >
                          {prod.stock_total > 0 ? `${prod.stock_total} u. en stock` : 'Sin stock'}
                        </span>
                        {prod.uso_recomendado && (
                          <span className="admin-pill admin-pill--neutral">
                            Uso: {prod.uso_recomendado}
                          </span>
                        )}
                      </div>

                      <div className="catalog-product-card__pricing">
                        <span>
                          Venta: <strong>{formatArs(prod.precio)}</strong>
                        </span>
                        <span>·</span>
                        <span>Costo: {formatArs(prodCosto)}</span>
                        <span>·</span>
                        <span>Margen: {prodMargin}%</span>
                        {prod.etiquetas.length > 0 && (
                          <>
                            <span>·</span>
                            <span>Tags: {prod.etiquetas.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="catalog-row__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() =>
                          setExpandedProductId(isExpanded ? null : prod.id)
                        }
                      >
                        {isExpanded
                          ? `Ocultar variantes (${prod.variantes.length})`
                          : `Variantes (${prod.variantes.length})`}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => startEdit(prod)}
                        disabled={isBusy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => void handleToggleActive(prod)}
                        disabled={isBusy}
                      >
                        {prod.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {confirming ? (
                        <div className="catalog-confirm-inline">
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary catalog-btn-sm"
                            onClick={() => void handleDelete(prod.id)}
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
                          onClick={() => setConfirmDeleteId(prod.id)}
                          disabled={isBusy}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <ProductVariantsPanel
                      product={prod}
                      onRefresh={loadData}
                      onOpenExtraction={onOpenExtraction}
                      onOpenLedger={onOpenLedger}
                      onStockMutated={onStockMutated}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}

        {products.length < totalProducts && (
          <button
            type="button"
            className="admin-btn admin-btn--secondary stock-more"
            onClick={() => setPageLimit((l) => l + 24)}
            disabled={loading}
          >
            {loading ? 'Cargando…' : 'Cargar más productos'}
          </button>
        )}
      </section>
    </div>
  );
}
