import { useState } from 'react';
import { formatArs } from '../Catalog/api';
import type { Producto, Variante } from '../Catalog/api';
import {
  ICONS,
  getDefaultAvailableVariant,
  getProductImage,
} from './storefront.types';
import type { StoreView, UserSession } from './storefront.types';

interface FavoritesViewProps {
  products: Producto[];
  favorites: string[];
  activeUser: UserSession | null;
  onToggleFavorite: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onAddToCart: (product: Producto, variant: Variante, quantity: number) => boolean;
  onNavigate: (view: StoreView) => void;
  onOpenCatalog: () => void;
  onOpenBackoffice: () => void;
  onLogout: () => void;
}

export function FavoritesView({
  products,
  favorites,
  activeUser,
  onToggleFavorite,
  onOpenProduct,
  onAddToCart,
  onNavigate,
  onOpenCatalog,
  onOpenBackoffice,
  onLogout,
}: FavoritesViewProps) {
  const [selectedVariantIds, setSelectedVariantIds] = useState<
    Record<string, string>
  >({});

  const favoriteProducts = products.filter((prod) =>
    favorites.includes(prod.id),
  );

  return (
    <div className="sf-favorites-view">
      <div className="sf-container sf-page-shell">
        <div className="sf-page-heading">
          <p className="sf-eyebrow">MI CUENTA / FAVORITOS</p>
          <h1 className="sf-page-title">TUS FAVORITOS</h1>
          <p className="sf-page-subtitle">
            Tu próxima elección empieza aquí. Tienes {favoriteProducts.length}{' '}
            {favoriteProducts.length === 1
              ? 'producto guardado.'
              : 'productos guardados.'}
          </p>
        </div>

        <div className="sf-account-grid">
          <nav className="sf-account-sidebar" aria-label="Navegación de cuenta">
            <p className="sf-account-sidebar__heading">MI CUENTA</p>
            <button
              type="button"
              className="sf-account-nav-item"
              onClick={() => onNavigate('account')}
            >
              Mi perfil y domicilios
            </button>
            <button
              type="button"
              className="sf-account-nav-item is-active"
              onClick={() => onNavigate('favorites')}
            >
              Favoritos ({favoriteProducts.length})
            </button>
            <button
              type="button"
              className="sf-account-nav-item"
              onClick={onOpenCatalog}
            >
              Catálogo de calzado
            </button>
            {activeUser?.rol === 'administrador' && (
              <button
                type="button"
                className="sf-account-nav-item"
                onClick={onOpenBackoffice}
              >
                Panel administrativo
              </button>
            )}
            <button
              type="button"
              className="sf-account-nav-item"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
            <hr className="sf-divider" />
            <p className="sf-account-sidebar__note">
              ¿Necesitas ayuda? soporte@sneackers.com
            </p>
          </nav>

          <div className="sf-account-content">
            {favoriteProducts.length === 0 ? (
              <div className="sf-state-box">
                <p>Todavía no guardaste calzado en tu lista de favoritos.</p>
                <button
                  type="button"
                  className="sf-btn sf-btn--primary"
                  onClick={onOpenCatalog}
                >
                  EXPLORAR CATÁLOGO
                </button>
              </div>
            ) : (
              <div className="sf-fav-grid">
                {favoriteProducts.map((prod, index) => {
                  const defaultVariant = getDefaultAvailableVariant(prod);
                  const chosenVariantId =
                    selectedVariantIds[prod.id] ?? defaultVariant?.id ?? '';
                  const chosenVariant = prod.variantes.find(
                    (v) => v.id === chosenVariantId,
                  );
                  const outOfStock =
                    prod.stock_total <= 0 ||
                    !chosenVariant ||
                    chosenVariant.stock_actual <= 0;

                  return (
                    <article key={prod.id} className="sf-fav-card">
                      <div className="sf-fav-card__media">
                        <img
                          src={getProductImage(prod, index)}
                          alt={prod.nombre}
                          className="sf-fav-card__img"
                          onClick={() => onOpenProduct(prod.id)}
                        />
                        <button
                          type="button"
                          className="sf-heart-circle"
                          onClick={() => onToggleFavorite(prod.id)}
                          title="Quitar de favoritos"
                          aria-label={`Quitar ${prod.nombre} de favoritos`}
                        >
                          <img
                            src={ICONS.heartActive}
                            alt=""
                            aria-hidden="true"
                            className="sf-icon"
                          />
                        </button>
                      </div>

                      <p className="sf-fav-card__eyebrow">
                        {prod.marca} · {prod.categoria?.nombre || 'CALZADO'}
                      </p>
                      <h2 className="sf-fav-card__title">{prod.nombre}</h2>
                      <p className="sf-fav-card__price">{formatArs(prod.precio)}</p>

                      {prod.variantes.length > 0 ? (
                        <label className="sf-select-wrap sf-select-wrap--full">
                          <select
                            className="sf-select"
                            value={chosenVariantId}
                            onChange={(e) =>
                              setSelectedVariantIds((prev) => ({
                                ...prev,
                                [prod.id]: e.target.value,
                              }))
                            }
                            aria-label={`Seleccionar variante para ${prod.nombre}`}
                          >
                            {prod.variantes.map((v) => (
                              <option key={v.id} value={v.id}>
                                Talle AR {v.talle} · {v.color} (
                                {v.stock_actual > 0
                                  ? `${v.stock_actual} u.`
                                  : 'Sin stock'}
                                )
                              </option>
                            ))}
                          </select>
                          <img
                            src={ICONS.chevronDown}
                            alt=""
                            aria-hidden="true"
                            className="sf-select-caret"
                          />
                        </label>
                      ) : (
                        <p className="sf-fav-card__no-variants">
                          Sin variantes disponibles
                        </p>
                      )}

                      <button
                        type="button"
                        className="sf-btn sf-btn--primary sf-btn--block"
                        disabled={outOfStock}
                        onClick={() => {
                          if (chosenVariant) {
                            onAddToCart(prod, chosenVariant, 1);
                          }
                        }}
                      >
                        {prod.stock_total <= 0
                          ? 'SIN STOCK'
                          : chosenVariant && chosenVariant.stock_actual <= 0
                            ? 'VARIANTE SIN STOCK'
                            : 'AGREGAR AL CARRITO'}
                      </button>

                      <div className="sf-fav-card__links">
                        <button
                          type="button"
                          className="sf-text-link sf-text-link--dark"
                          onClick={() => onOpenProduct(prod.id)}
                        >
                          Ver producto
                        </button>
                        <button
                          type="button"
                          className="sf-text-link sf-text-link--danger"
                          onClick={() => onToggleFavorite(prod.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="sf-notice-card">
              <img
                src={ICONS.shieldCheck}
                alt=""
                aria-hidden="true"
                className="sf-icon"
              />
              <div className="sf-notice-card__body">
                <strong>Elige tu talle antes de agregar</strong>
                <p>
                  Guardar un producto no reserva stock ni mantiene su precio. La disponibilidad se confirma al iniciar la compra.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="sf-btn sf-btn--outline sf-btn--block"
              onClick={onOpenCatalog}
            >
              SEGUIR COMPRANDO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
