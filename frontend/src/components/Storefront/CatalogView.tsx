import { formatArs } from '../Catalog/api';
import type { Categoria, Producto } from '../Catalog/api';
import {
  ICONS,
  SPORT_DISCIPLINES,
  filterAndSortProducts,
  getProductImage,
  productMatchesDiscipline,
} from './storefront.types';
import type {
  CatalogFilters,
  PriceRangeFilter,
  SortOption,
} from './storefront.types';

interface CatalogViewProps {
  products: Producto[];
  categories: Categoria[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: CatalogFilters;
  favorites: string[];
  isAdmin: boolean;
  onUpdateFilters: (patch: Partial<CatalogFilters>) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpenProduct: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onOpenBackoffice: () => void;
}

const PRICE_LABELS: Record<PriceRangeFilter, string> = {
  all: 'Todos los precios',
  'under-80k': 'Hasta $80.000',
  '80k-140k': '$80.000 a $140.000',
  'over-140k': 'Más de $140.000',
};

const compareSizes = (a: string, b: string): number => {
  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.localeCompare(b, 'es');
};

export function CatalogView({
  products,
  categories,
  total,
  loading,
  error,
  filters,
  favorites,
  isAdmin,
  onUpdateFilters,
  onResetFilters,
  onRetry,
  onLoadMore,
  onOpenProduct,
  onToggleFavorite,
  onOpenBackoffice,
}: CatalogViewProps) {
  const activeCategory = categories.find((c) => c.id === filters.categoriaId);

  const disciplineProducts = filters.sportTag
    ? products.filter((prod) => productMatchesDiscipline(prod, filters.sportTag))
    : products;

  const visibleProducts = filterAndSortProducts(disciplineProducts, filters);

  const availableTalles = Array.from(
    new Set(
      disciplineProducts.flatMap((prod) => prod.variantes.map((v) => v.talle)),
    ),
  ).sort(compareSizes);

  const availableColors = Array.from(
    new Set(
      disciplineProducts.flatMap((prod) => prod.variantes.map((v) => v.color)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const availableBrands = Array.from(
    new Set(
      disciplineProducts
        .map((prod) => prod.marca.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const heroTitle =
    filters.sportLabel ||
    activeCategory?.nombre ||
    filters.marca ||
    (filters.search ? `Resultados: ${filters.search}` : 'Catálogo Completo');

  const hasClientOnlyFilters = Boolean(
    filters.sportTag ||
      filters.talle ||
      filters.color ||
      filters.priceRange !== 'all' ||
      filters.onlyInStock,
  );

  const hasAnyFilter = Boolean(
    filters.search ||
      filters.categoriaId ||
      filters.sportTag ||
      filters.marca ||
      filters.talle ||
      filters.color ||
      filters.priceRange !== 'all' ||
      filters.onlyInStock,
  );

  const activeChips: Array<{ id: string; label: string; clear: () => void }> = [];

  if (filters.categoriaId) {
    activeChips.push({
      id: 'categoria',
      label: activeCategory?.nombre || 'Categoría',
      clear: () => onUpdateFilters({ categoriaId: '' }),
    });
  }
  if (filters.sportTag) {
    activeChips.push({
      id: 'sport',
      label: filters.sportLabel || filters.sportTag,
      clear: () => onUpdateFilters({ sportTag: '', sportLabel: '' }),
    });
  }
  if (filters.marca) {
    activeChips.push({
      id: 'marca',
      label: `Marca: ${filters.marca}`,
      clear: () => onUpdateFilters({ marca: '' }),
    });
  }
  if (filters.talle) {
    activeChips.push({
      id: 'talle',
      label: `Talle ${filters.talle}`,
      clear: () => onUpdateFilters({ talle: '' }),
    });
  }
  if (filters.color) {
    activeChips.push({
      id: 'color',
      label: filters.color,
      clear: () => onUpdateFilters({ color: '' }),
    });
  }
  if (filters.priceRange !== 'all') {
    activeChips.push({
      id: 'price',
      label: PRICE_LABELS[filters.priceRange],
      clear: () => onUpdateFilters({ priceRange: 'all' }),
    });
  }
  if (filters.onlyInStock) {
    activeChips.push({
      id: 'stock',
      label: 'Solo con stock',
      clear: () => onUpdateFilters({ onlyInStock: false }),
    });
  }
  if (filters.search) {
    activeChips.push({
      id: 'search',
      label: `"${filters.search}"`,
      clear: () => onUpdateFilters({ search: '' }),
    });
  }

  const countLabel =
    !hasClientOnlyFilters && total > visibleProducts.length
      ? `${visibleProducts.length} DE ${total} PRODUCTOS`
      : `${visibleProducts.length} ${
          visibleProducts.length === 1 ? 'PRODUCTO' : 'PRODUCTOS'
        }`;

  return (
    <div className="sf-catalog-view">
      <section className="sf-page-hero sf-page-hero--light">
        <div className="sf-container sf-page-hero__inner">
          <p className="sf-page-hero__eyebrow">CATÁLOGO ESPECIALIZADO</p>
          <h1 className="sf-page-hero__title">{heroTitle}</h1>
          <p className="sf-page-hero__subtitle">
            Filtra por categoría, disciplina, marca, talle, color o rango de precio. Los modelos sin stock permanecen visibles al final del listado.
          </p>
        </div>
      </section>

      <section className="sf-section sf-section--catalog">
        <div className="sf-container">
          <div className="sf-catalog-controls">
            <div className="sf-catalog-meta">
              <div className="sf-catalog-meta__head">
                <p className="sf-catalog-count">{countLabel}</p>
                {hasAnyFilter && (
                  <button
                    type="button"
                    className="sf-text-link sf-text-link--danger"
                    onClick={onResetFilters}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {activeChips.length > 0 && (
                <div className="sf-filter-chips">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className="sf-filter-chip"
                      onClick={chip.clear}
                      title="Quitar filtro"
                    >
                      <span>{chip.label}</span>
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sf-filters-bar">
              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.categoriaId}
                  onChange={(e) => onUpdateFilters({ categoriaId: e.target.value })}
                  aria-label="Filtrar por categoría"
                >
                  <option value="">Categoría: Todas</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.sportTag}
                  onChange={(e) => {
                    const nextTag = e.target.value;
                    const match = SPORT_DISCIPLINES.find((d) => d.tag === nextTag);
                    onUpdateFilters({
                      sportTag: nextTag,
                      sportLabel: match?.name || '',
                    });
                  }}
                  aria-label="Filtrar por deporte o uso"
                >
                  <option value="">Deporte / Uso: Todos</option>
                  {SPORT_DISCIPLINES.map((disc) => (
                    <option key={disc.id} value={disc.tag}>
                      {disc.name}
                    </option>
                  ))}
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.marca}
                  onChange={(e) => onUpdateFilters({ marca: e.target.value })}
                  aria-label="Filtrar por marca"
                >
                  <option value="">Marca: Todas</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                  {filters.marca &&
                    !availableBrands.some(
                      (b) => b.toLowerCase() === filters.marca.toLowerCase(),
                    ) && <option value={filters.marca}>{filters.marca}</option>}
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.talle}
                  onChange={(e) => onUpdateFilters({ talle: e.target.value })}
                  aria-label="Filtrar por talle"
                >
                  <option value="">Talle: Todos</option>
                  {availableTalles.map((talle) => (
                    <option key={talle} value={talle}>
                      Talle {talle}
                    </option>
                  ))}
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.color}
                  onChange={(e) => onUpdateFilters({ color: e.target.value })}
                  aria-label="Filtrar por color"
                >
                  <option value="">Color: Todos</option>
                  {availableColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.priceRange}
                  onChange={(e) =>
                    onUpdateFilters({
                      priceRange: e.target.value as PriceRangeFilter,
                    })
                  }
                  aria-label="Filtrar por rango de precio"
                >
                  <option value="all">Rango de precio</option>
                  <option value="under-80k">Hasta $80.000</option>
                  <option value="80k-140k">$80.000 a $140.000</option>
                  <option value="over-140k">Más de $140.000</option>
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <label className="sf-select-wrap">
                <select
                  className="sf-select"
                  value={filters.sort}
                  onChange={(e) =>
                    onUpdateFilters({ sort: e.target.value as SortOption })
                  }
                  aria-label="Ordenar productos"
                >
                  <option value="featured">Ordenar: destacados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="newest">Más recientes</option>
                </select>
                <img src={ICONS.chevronDown} alt="" aria-hidden="true" className="sf-select-caret" />
              </label>

              <button
                type="button"
                className={`sf-stock-toggle ${filters.onlyInStock ? 'is-active' : ''}`}
                onClick={() => onUpdateFilters({ onlyInStock: !filters.onlyInStock })}
              >
                Solo con stock
              </button>
            </div>

            <hr className="sf-divider-dark" />
          </div>

          {error ? (
            <div className="sf-state-box sf-state-box--error" role="alert">
              <p>{error}</p>
              <button type="button" className="sf-btn sf-btn--primary" onClick={onRetry}>
                Reintentar
              </button>
            </div>
          ) : loading && visibleProducts.length === 0 ? (
            <div className="sf-state-box">Cargando catálogo de productos…</div>
          ) : visibleProducts.length === 0 ? (
            <div className="sf-state-box">
              <p>
                {hasAnyFilter
                  ? 'No encontramos productos que coincidan con los filtros seleccionados.'
                  : 'Todavía no hay productos publicados en la tienda.'}
              </p>
              <div className="sf-state-box__actions">
                {hasAnyFilter && (
                  <button
                    type="button"
                    className="sf-btn sf-btn--outline"
                    onClick={onResetFilters}
                  >
                    Limpiar filtros
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="sf-btn sf-btn--primary"
                    onClick={onOpenBackoffice}
                  >
                    Cargar productos en Backoffice
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="sf-compact-grid">
                {visibleProducts.map((prod, index) => {
                  const isFav = favorites.includes(prod.id);
                  const outOfStock = prod.stock_total <= 0;
                  return (
                    <article
                      key={prod.id}
                      className={`sf-compact-card ${outOfStock ? 'is-out' : ''}`}
                      onClick={() => onOpenProduct(prod.id)}
                    >
                      <div className="sf-compact-card__media">
                        <img
                          src={getProductImage(prod, index)}
                          alt={prod.nombre}
                          className="sf-compact-card__img"
                        />
                        {outOfStock && <span className="sf-stock-pill">Sin stock</span>}
                        <button
                          type="button"
                          className="sf-heart-chip"
                          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(prod.id);
                          }}
                        >
                          <img
                            src={isFav ? ICONS.heartActive : ICONS.heartOutline}
                            alt=""
                            aria-hidden="true"
                            className="sf-icon"
                          />
                        </button>
                      </div>
                      <div className="sf-compact-card__body">
                        <h2 className="sf-compact-card__title">{prod.nombre}</h2>
                        <p className="sf-compact-card__sub">
                          {prod.marca} · {prod.categoria?.nombre || 'Calzado'}
                        </p>
                        <p className="sf-compact-card__price">{formatArs(prod.precio)}</p>
                        {prod.variantes.length > 0 && (
                          <p className="sf-compact-card__variants">
                            {prod.variantes.length}{' '}
                            {prod.variantes.length === 1 ? 'variante' : 'variantes'}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {products.length < total && (
                <div className="sf-pagination">
                  <button
                    type="button"
                    className="sf-btn sf-btn--outline"
                    onClick={onLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Cargando…' : 'Ver más productos'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
