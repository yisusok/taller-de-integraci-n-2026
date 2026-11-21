import { useEffect, useState } from 'react';
import { catalogApi, formatArs, messageFromError } from '../Catalog/api';
import type { Producto, Variante } from '../Catalog/api';
import { ICONS, getProductImage } from './storefront.types';

interface ProductDetailViewProps {
  productId: string;
  initialProduct?: Producto;
  favorites: string[];
  onBack: () => void;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (product: Producto, variant: Variante, quantity: number) => boolean;
  onFilterByCategory: (categoriaId: string) => void;
  onFilterByTag: (tag: string) => void;
}

const compareSizes = (a: string, b: string): number => {
  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.localeCompare(b, 'es');
};

export function ProductDetailView({
  productId,
  initialProduct,
  favorites,
  onBack,
  onToggleFavorite,
  onAddToCart,
  onFilterByCategory,
  onFilterByTag,
}: ProductDetailViewProps) {
  const [loadedProduct, setLoadedProduct] = useState<{
    id: string;
    data: Producto;
  } | null>(null);
  const [fetchError, setFetchError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [selectionState, setSelectionState] = useState<{
    productId: string;
    talle: string;
    color: string;
    quantity: number;
  }>({
    productId,
    talle: '',
    color: '',
    quantity: 1,
  });

  const [feedback, setFeedback] = useState<{
    productId: string;
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      catalogApi
        .getProduct(productId)
        .then((prod) => {
          if (ignore) return;
          setLoadedProduct({ id: productId, data: prod });
          setFetchError(null);
        })
        .catch((err: unknown) => {
          if (ignore) return;
          setFetchError({
            id: productId,
            message: messageFromError(err, 'No se pudo cargar el detalle del producto.'),
          });
        });
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [productId, reloadNonce]);

  const product =
    loadedProduct?.id === productId ? loadedProduct.data : initialProduct;
  const activeError = fetchError?.id === productId ? fetchError.message : null;
  const loading = !product && !activeError;

  if (loading) {
    return (
      <div className="sf-container sf-detail-state">
        <div className="sf-state-box">Cargando ficha del producto…</div>
      </div>
    );
  }

  if (activeError && !product) {
    return (
      <div className="sf-container sf-detail-state">
        <div className="sf-state-box sf-state-box--error" role="alert">
          <p>{activeError}</p>
          <div className="sf-state-box__actions">
            <button
              type="button"
              className="sf-btn sf-btn--outline"
              onClick={onBack}
            >
              Volver
            </button>
            <button
              type="button"
              className="sf-btn sf-btn--primary"
              onClick={() => setReloadNonce((n) => n + 1)}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isFavorite = favorites.includes(product.id);
  const outOfStock = product.stock_total <= 0;

  const talles = Array.from(
    new Set(product.variantes.map((v) => v.talle)),
  ).sort(compareSizes);

  const defaultVariant =
    product.variantes.find((v) => v.stock_actual > 0) ?? product.variantes[0];

  const currentSelection =
    selectionState.productId === product.id
      ? selectionState
      : { productId: product.id, talle: '', color: '', quantity: 1 };

  const selectedTalle =
    currentSelection.talle && talles.includes(currentSelection.talle)
      ? currentSelection.talle
      : defaultVariant?.talle || talles[0] || '';

  const variantsForTalle = selectedTalle
    ? product.variantes.filter((v) => v.talle === selectedTalle)
    : product.variantes;

  const allColors = Array.from(
    new Set(product.variantes.map((v) => v.color)),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const inTalleColors = new Set(variantsForTalle.map((v) => v.color));
  const defaultColorForTalle =
    variantsForTalle.find((v) => v.stock_actual > 0)?.color ??
    variantsForTalle[0]?.color ??
    '';

  const selectedColor =
    currentSelection.color && inTalleColors.has(currentSelection.color)
      ? currentSelection.color
      : defaultColorForTalle;

  const chosenVariant = product.variantes.find(
    (v) => v.talle === selectedTalle && v.color === selectedColor,
  );

  const maxStock = chosenVariant?.stock_actual ?? 0;
  const safeQuantity =
    maxStock > 0 ? Math.min(Math.max(1, currentSelection.quantity), maxStock) : 1;

  const handleSelectTalle = (nextTalle: string) => {
    const candidates = product.variantes.filter((v) => v.talle === nextTalle);
    const keepColor = candidates.some((v) => v.color === selectedColor)
      ? selectedColor
      : candidates.find((v) => v.stock_actual > 0)?.color ??
        candidates[0]?.color ??
        '';
    setFeedback(null);
    setSelectionState({
      productId: product.id,
      talle: nextTalle,
      color: keepColor,
      quantity: 1,
    });
  };

  const handleSelectColor = (nextColor: string) => {
    const hasCurrentTalle = product.variantes.some(
      (v) => v.talle === selectedTalle && v.color === nextColor,
    );
    const nextTalle = hasCurrentTalle
      ? selectedTalle
      : product.variantes.find(
          (v) => v.color === nextColor && v.stock_actual > 0,
        )?.talle ??
        product.variantes.find((v) => v.color === nextColor)?.talle ??
        selectedTalle;
    setFeedback(null);
    setSelectionState({
      productId: product.id,
      talle: nextTalle,
      color: nextColor,
      quantity: 1,
    });
  };

  const handleAddClick = () => {
    if (!chosenVariant || chosenVariant.stock_actual <= 0) {
      setFeedback({
        productId: product.id,
        type: 'error',
        text: 'La combinación seleccionada no tiene stock disponible.',
      });
      return;
    }

    const added = onAddToCart(product, chosenVariant, safeQuantity);
    if (added) {
      setFeedback({
        productId: product.id,
        type: 'ok',
        text: `Agregaste ${safeQuantity} × ${product.nombre} (Talle ${chosenVariant.talle} · ${chosenVariant.color}) al carrito.`,
      });
    }
  };

  const activeFeedback = feedback?.productId === product.id ? feedback : null;
  const cuota = formatArs(Math.round(product.precio / 3));

  return (
    <div className="sf-product-detail">
      <div className="sf-container">
        <div className="sf-breadcrumb-bar">
          <button type="button" className="sf-back-btn" onClick={onBack}>
            ← Volver
          </button>
          <nav className="sf-breadcrumbs" aria-label="Ruta del producto">
            <span>Inicio</span>
            <span>/</span>
            {product.categoria && (
              <>
                <button
                  type="button"
                  className="sf-breadcrumb-link"
                  onClick={() => onFilterByCategory(product.categoria_id)}
                >
                  {product.categoria.nombre}
                </button>
                <span>/</span>
              </>
            )}
            <span className="sf-breadcrumbs__current">{product.nombre}</span>
          </nav>
        </div>

        <div className="sf-detail-layout">
          <div className="sf-detail-left">
            <div className="sf-detail-gallery">
              <img
                src={getProductImage(product)}
                alt={product.nombre}
                className="sf-detail-gallery__img"
              />
              {outOfStock && (
                <span className="sf-stock-pill sf-stock-pill--lg">Sin stock</span>
              )}
            </div>

            <div className="sf-specs-card">
              <h2 className="sf-specs-card__title">ESPECIFICACIONES</h2>
              <dl className="sf-specs-list">
                <div className="sf-specs-row">
                  <dt>Marca</dt>
                  <dd>{product.marca}</dd>
                </div>
                <div className="sf-specs-row">
                  <dt>SKU base</dt>
                  <dd className="sf-mono">{product.sku}</dd>
                </div>
                <div className="sf-specs-row">
                  <dt>Categoría</dt>
                  <dd>{product.categoria?.nombre || 'Calzado deportivo'}</dd>
                </div>
                {product.uso_recomendado && (
                  <div className="sf-specs-row">
                    <dt>Uso recomendado</dt>
                    <dd>{product.uso_recomendado}</dd>
                  </div>
                )}
                {product.garantia && (
                  <div className="sf-specs-row">
                    <dt>Garantía</dt>
                    <dd>{product.garantia}</dd>
                  </div>
                )}
                {chosenVariant?.material && (
                  <div className="sf-specs-row">
                    <dt>Material</dt>
                    <dd>{chosenVariant.material}</dd>
                  </div>
                )}
              </dl>

              {product.etiquetas.length > 0 && (
                <div className="sf-specs-tags">
                  {product.etiquetas.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="sf-chip"
                      onClick={() => onFilterByTag(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sf-detail-right">
            <div className="sf-fav-callout">
              <div>
                <p className="sf-fav-callout__title">
                  {isFavorite ? 'GUARDADO EN FAVORITOS' : 'AGREGAR A FAVORITOS'}
                </p>
                <p className="sf-fav-callout__sub">
                  Guarda este producto para comparar o comprar después
                </p>
              </div>
              <button
                type="button"
                className={`sf-btn sf-btn--block ${
                  isFavorite ? 'sf-btn--dark' : 'sf-btn--primary'
                }`}
                onClick={() => onToggleFavorite(product.id)}
              >
                <img
                  src={ICONS.heartWhite}
                  alt=""
                  aria-hidden="true"
                  className="sf-icon"
                />
                <span>{isFavorite ? 'GUARDADO' : 'GUARDAR'}</span>
              </button>
            </div>

            <div className="sf-detail-copy">
              <p className="sf-detail-eyebrow">
                {product.marca} · {product.categoria?.nombre || 'CALZADO'}
              </p>
              <h1 className="sf-detail-title">{product.nombre}</h1>
              {product.descripcion && (
                <p className="sf-detail-desc">{product.descripcion}</p>
              )}
            </div>

            <div className="sf-price-block">
              <p className="sf-detail-price">{formatArs(product.precio)}</p>
              <p className="sf-detail-installments">
                ✓ 3 cuotas sin interés de {cuota} con tarjetas seleccionadas
              </p>
            </div>

            {talles.length > 0 && (
              <div className="sf-selector-block">
                <p className="sf-selector-label">TALLE (AR)</p>
                <div className="sf-size-grid">
                  {talles.map((talle) => {
                    const hasStock = product.variantes.some(
                      (v) => v.talle === talle && v.stock_actual > 0,
                    );
                    return (
                      <button
                        key={talle}
                        type="button"
                        className={`sf-size-pill ${
                          selectedTalle === talle ? 'is-selected' : ''
                        } ${!hasStock ? 'is-empty' : ''}`}
                        onClick={() => handleSelectTalle(talle)}
                      >
                        {talle}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allColors.length > 0 && (
              <div className="sf-selector-block">
                <p className="sf-selector-label">COLOR</p>
                <div className="sf-color-grid">
                  {allColors.map((color) => {
                    const matching = product.variantes.find(
                      (v) => v.talle === selectedTalle && v.color === color,
                    );
                    const hasStockInProduct = product.variantes.some(
                      (v) => v.color === color && v.stock_actual > 0,
                    );
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`sf-color-pill ${
                          selectedColor === color ? 'is-selected' : ''
                        } ${!matching || matching.stock_actual <= 0 ? 'is-muted' : ''}`}
                        disabled={!hasStockInProduct && product.variantes.length === 0}
                        onClick={() => handleSelectColor(color)}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sf-variant-status">
              {chosenVariant ? (
                <span
                  className={`sf-variant-badge ${
                    chosenVariant.stock_actual > 0 ? 'is-ok' : 'is-out'
                  }`}
                >
                  {chosenVariant.stock_actual > 0
                    ? `Disponible: ${chosenVariant.stock_actual} u. · SKU ${chosenVariant.sku_variante}`
                    : 'Sin stock en esta combinación'}
                </span>
              ) : (
                <span className="sf-variant-badge is-out">
                  {product.variantes.length === 0
                    ? 'Este producto aún no tiene variantes cargadas.'
                    : 'Selecciona talle y color disponibles.'}
                </span>
              )}
            </div>

            <div className="sf-purchase-block">
              <div className="sf-stepper">
                <button
                  type="button"
                  onClick={() =>
                    setSelectionState({
                      productId: product.id,
                      talle: selectedTalle,
                      color: selectedColor,
                      quantity: Math.max(1, safeQuantity - 1),
                    })
                  }
                  disabled={safeQuantity <= 1 || maxStock <= 0}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span>{safeQuantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectionState({
                      productId: product.id,
                      talle: selectedTalle,
                      color: selectedColor,
                      quantity: Math.min(maxStock, safeQuantity + 1),
                    })
                  }
                  disabled={safeQuantity >= maxStock || maxStock <= 0}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="sf-btn sf-btn--primary sf-btn--block sf-btn--lg"
                disabled={outOfStock || !chosenVariant || chosenVariant.stock_actual <= 0}
                onClick={handleAddClick}
              >
                {outOfStock
                  ? 'SIN STOCK'
                  : chosenVariant && chosenVariant.stock_actual <= 0
                    ? 'SIN STOCK EN ESTA VARIANTE'
                    : 'AGREGAR AL CARRITO'}
              </button>
            </div>

            {activeFeedback && (
              <div
                className={`sf-inline-alert ${
                  activeFeedback.type === 'ok' ? 'is-ok' : 'is-error'
                }`}
                role="status"
              >
                {activeFeedback.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
