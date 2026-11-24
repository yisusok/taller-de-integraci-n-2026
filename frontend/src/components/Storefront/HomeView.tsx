import { formatArs } from '../Catalog/api';
import type { Producto } from '../Catalog/api';
import {
  BENTO_FALLBACKS,
  BRAND_TILES,
  HERO_FALLBACK_IMAGE,
  ICONS,
  SPORT_DISCIPLINES,
  getProductImage,
} from './storefront.types';

interface HomeViewProps {
  products: Producto[];
  loading: boolean;
  error: string | null;
  favorites: string[];
  isAdmin: boolean;
  onRetry: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenCatalog: () => void;
  onOpenSports: () => void;
  onSelectDiscipline: (tag: string, label: string) => void;
  onSelectBrand: (brand: string) => void;
  onOpenCombos: () => void;
  onToggleFavorite: (productId: string) => void;
  onQuickAddToCart: (product: Producto) => void;
  onOpenBackoffice: () => void;
}

export function HomeView({
  products,
  loading,
  error,
  favorites,
  isAdmin,
  onRetry,
  onOpenProduct,
  onOpenCatalog,
  onOpenSports,
  onSelectDiscipline,
  onSelectBrand,
  onOpenCombos,
  onToggleFavorite,
  onQuickAddToCart,
  onOpenBackoffice,
}: HomeViewProps) {
  const heroProduct = products.find((p) => p.stock_total > 0) ?? products[0];
  const featuredProducts = products.slice(0, 4);
  const newestProducts = [...products]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 4);

  const knownBrands = new Set(
    BRAND_TILES.map((brand) => brand.name.toLowerCase()),
  );
  const extraBrands = Array.from(
    new Set(
      products
        .map((p) => p.marca.trim())
        .filter((marca) => marca && !knownBrands.has(marca.toLowerCase())),
    ),
  );

  const bentoProducts = [
    { label: 'DESTACADO', prod: products[0], fallback: HERO_FALLBACK_IMAGE },
    { label: 'NUEVO', prod: products[1], fallback: BENTO_FALLBACKS.nuevo },
    { label: 'TENDENCIA', prod: products[2], fallback: BENTO_FALLBACKS.tendencia },
    { label: 'OFERTA 1', prod: products[3], fallback: BENTO_FALLBACKS.oferta1 },
    { label: 'OFERTA 2', prod: products[4], fallback: BENTO_FALLBACKS.oferta2 },
  ];

  const heroImageUrl = heroProduct?.imagen_url?.trim() || HERO_FALLBACK_IMAGE;

  return (
    <div className="sf-home">
      <section className="sf-hero" aria-label="Lanzamiento destacado">
        <div className="sf-container sf-hero__grid">
          <div className="sf-hero__copy">
            <p className="sf-hero__eyebrow">NUEVO LANZAMIENTO</p>
            <h1 className="sf-hero__title">
              {heroProduct ? heroProduct.nombre : 'CALZADO DEPORTIVO TÉCNICO'}
            </h1>
            <p className="sf-hero__desc">
              {heroProduct?.descripcion ||
                heroProduct?.uso_recomendado ||
                'Selección curada para running, fútbol, básquet, training y uso urbano con stock real actualizado.'}
            </p>

            <div className="sf-hero__price-block">
              {heroProduct ? (
                <>
                  <span className="sf-hero__meta">
                    {heroProduct.marca} · {heroProduct.categoria?.nombre || 'Calzado'}
                  </span>
                  <p className="sf-hero__price">{formatArs(heroProduct.precio)}</p>
                  <p className="sf-hero__installments">
                    ✓ 3 cuotas sin interés de {formatArs(Math.round(heroProduct.precio / 3))}
                  </p>
                </>
              ) : (
                <p className="sf-hero__price">Colección 2026</p>
              )}
            </div>

            <div className="sf-hero__actions">
              <button
                type="button"
                className="sf-btn sf-btn--primary"
                onClick={() =>
                  heroProduct ? onOpenProduct(heroProduct.id) : onOpenCatalog()
                }
              >
                COMPRAR AHORA
              </button>
              <button
                type="button"
                className="sf-btn sf-btn--ghost-light"
                onClick={onOpenCatalog}
              >
                EXPLORAR CATÁLOGO
              </button>
            </div>
          </div>

          <div className="sf-hero__media">
            <div className="sf-hero__frame">
              <img
                src={heroImageUrl}
                alt={heroProduct ? heroProduct.nombre : 'Zapatilla deportiva destacada'}
                className="sf-hero__img"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sf-section" aria-labelledby="home-sports-heading">
        <div className="sf-container">
          <div className="sf-section-head sf-section-head--split">
            <h2 id="home-sports-heading" className="sf-section-title">
              ZAPATILLAS POR DEPORTE
            </h2>
            <button
              type="button"
              className="sf-text-link"
              onClick={onOpenSports}
            >
              Ver todas las disciplinas →
            </button>
          </div>

          <div className="sf-sports-strip">
            {SPORT_DISCIPLINES.map((disc) => (
              <button
                key={disc.id}
                type="button"
                className="sf-sport-tile"
                onClick={() => onSelectDiscipline(disc.tag, disc.name)}
              >
                <div className="sf-sport-tile__img-box">
                  <img src={disc.image} alt={disc.name} className="sf-sport-tile__img" />
                </div>
                <span className="sf-sport-tile__name">{disc.shortName}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <hr className="sf-section-rule" />

      <section className="sf-section" aria-labelledby="home-featured-heading">
        <div className="sf-container">
          <div className="sf-section-head sf-section-head--ruled">
            <h2 id="home-featured-heading" className="sf-section-title sf-section-title--sentence">
              Productos Destacados
            </h2>
            <button
              type="button"
              className="sf-text-link"
              onClick={onOpenCatalog}
            >
              Ver todo →
            </button>
          </div>

          {error ? (
            <div className="sf-state-box sf-state-box--error" role="alert">
              <p>{error}</p>
              <button type="button" className="sf-btn sf-btn--primary" onClick={onRetry}>
                Reintentar
              </button>
            </div>
          ) : loading && products.length === 0 ? (
            <div className="sf-state-box">Cargando productos destacados…</div>
          ) : featuredProducts.length === 0 ? (
            <div className="sf-state-box">
              <p>Todavía no hay productos publicados en la tienda.</p>
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
          ) : (
            <div className="sf-compact-grid">
              {featuredProducts.map((prod, index) => {
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
                      <h3 className="sf-compact-card__title">{prod.nombre}</h3>
                      <p className="sf-compact-card__sub">
                        {prod.categoria?.nombre || prod.marca}
                      </p>
                      <p className="sf-compact-card__price">{formatArs(prod.precio)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {newestProducts.length > 0 && (
        <section className="sf-section sf-section--tight-top" aria-labelledby="home-newest-heading">
          <div className="sf-container">
            <div className="sf-section-head">
              <h2 id="home-newest-heading" className="sf-section-title">
                NOVEDADES
              </h2>
            </div>

            <div className="sf-action-grid">
              {newestProducts.map((prod, index) => {
                const isFav = favorites.includes(prod.id);
                const outOfStock = prod.stock_total <= 0;
                return (
                  <article key={prod.id} className={`sf-action-card ${outOfStock ? 'is-out' : ''}`}>
                    <button
                      type="button"
                      className="sf-action-card__preview"
                      onClick={() => onOpenProduct(prod.id)}
                    >
                      <div className="sf-action-card__img-box">
                        <img
                          src={getProductImage(prod, index)}
                          alt={prod.nombre}
                          className="sf-action-card__img"
                        />
                        {outOfStock && <span className="sf-stock-pill">Sin stock</span>}
                      </div>
                      <span className="sf-action-card__brand">{prod.marca}</span>
                      <span className="sf-action-card__title">{prod.nombre}</span>
                      <span className="sf-action-card__price">{formatArs(prod.precio)}</span>
                      <span
                        className={`sf-action-card__stock ${
                          outOfStock ? 'is-out' : 'is-ok'
                        }`}
                      >
                        {outOfStock
                          ? 'Sin stock disponible'
                          : `${prod.stock_total} u. disponibles`}
                      </span>
                    </button>

                    <div className="sf-action-card__buttons">
                      <button
                        type="button"
                        className="sf-btn sf-btn--primary sf-btn--block"
                        disabled={outOfStock}
                        onClick={() => onQuickAddToCart(prod)}
                      >
                        {outOfStock ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                      </button>
                      <button
                        type="button"
                        className={`sf-btn sf-btn--outline sf-btn--block sf-btn--fav ${
                          isFav ? 'is-fav' : ''
                        }`}
                        onClick={() => onToggleFavorite(prod.id)}
                      >
                        <img
                          src={isFav ? ICONS.heartActive : ICONS.heartOutline}
                          alt=""
                          aria-hidden="true"
                          className="sf-icon"
                        />
                        <span>{isFav ? 'EN FAVORITOS' : 'AGREGAR A FAVORITOS'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <hr className="sf-section-rule" />

      <section className="sf-offers-banner" aria-label="Combos y promociones">
        <div className="sf-container sf-offers-banner__inner">
          <div className="sf-offers-banner__copy">
            <h2 className="sf-offers-banner__title">
              HASTA 40% OFF EN PRODUCTOS SELECCIONADOS
            </h2>
            <p className="sf-offers-banner__subtitle">
              Descuento exclusivo online para todas las disciplinas deportivas por tiempo limitado.
            </p>
          </div>
          <button
            type="button"
            className="sf-btn sf-btn--primary"
            onClick={onOpenCombos}
          >
            VER COMBOS Y PROMOCIONES
          </button>
        </div>
      </section>

      <section className="sf-section" aria-labelledby="home-bento-heading">
        <div className="sf-container">
          <div className="sf-section-head">
            <h2 id="home-bento-heading" className="sf-section-title sf-section-title--left">
              Lo Más Destacado
            </h2>
          </div>

          <div className="sf-bento">
            <div className="sf-bento__row-top">
              <button
                type="button"
                className="sf-bento-card sf-bento-card--tall"
                onClick={() =>
                  bentoProducts[0].prod
                    ? onOpenProduct(bentoProducts[0].prod.id)
                    : onOpenCatalog()
                }
              >
                <div className="sf-bento-card__img-wrap">
                  <img
                    src={
                      bentoProducts[0].prod?.imagen_url?.trim() ||
                      bentoProducts[0].fallback
                    }
                    alt={bentoProducts[0].prod?.nombre || bentoProducts[0].label}
                  />
                </div>
                <div className="sf-bento-card__footer">
                  <span className="sf-bento-card__tag">{bentoProducts[0].label}</span>
                  {bentoProducts[0].prod && (
                    <span className="sf-bento-card__name">
                      {bentoProducts[0].prod.nombre}
                    </span>
                  )}
                </div>
              </button>

              <div className="sf-bento__col-side">
                {bentoProducts.slice(1, 3).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="sf-bento-card"
                    onClick={() =>
                      item.prod ? onOpenProduct(item.prod.id) : onOpenCatalog()
                    }
                  >
                    <div className="sf-bento-card__img-wrap">
                      <img
                        src={item.prod?.imagen_url?.trim() || item.fallback}
                        alt={item.prod?.nombre || item.label}
                      />
                    </div>
                    <div className="sf-bento-card__footer">
                      <span className="sf-bento-card__tag">{item.label}</span>
                      {item.prod && (
                        <span className="sf-bento-card__name">{item.prod.nombre}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="sf-bento__row-bottom">
              {bentoProducts.slice(3, 5).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="sf-bento-card"
                  onClick={() =>
                    item.prod ? onOpenProduct(item.prod.id) : onOpenCatalog()
                  }
                >
                  <div className="sf-bento-card__img-wrap">
                    <img
                      src={item.prod?.imagen_url?.trim() || item.fallback}
                      alt={item.prod?.nombre || item.label}
                    />
                  </div>
                  <div className="sf-bento-card__footer">
                    <span className="sf-bento-card__tag">{item.label}</span>
                    {item.prod && (
                      <span className="sf-bento-card__name">{item.prod.nombre}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sf-section sf-section--tight-top" aria-labelledby="home-brands-heading">
        <div className="sf-container">
          <div className="sf-section-head">
            <h2 id="home-brands-heading" className="sf-section-title">
              MARCAS
            </h2>
          </div>

          <div className="sf-brands-grid">
            {BRAND_TILES.map((brand) => (
              <button
                key={brand.name}
                type="button"
                className="sf-brand-card"
                onClick={() => onSelectBrand(brand.name)}
                aria-label={`Filtrar por ${brand.name}`}
              >
                <img src={brand.image} alt={brand.name} className="sf-brand-card__img" />
              </button>
            ))}
          </div>

          {extraBrands.length > 0 && (
            <div className="sf-extra-brands">
              <span className="sf-extra-brands__label">Más marcas en tienda:</span>
              {extraBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className="sf-chip"
                  onClick={() => onSelectBrand(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
