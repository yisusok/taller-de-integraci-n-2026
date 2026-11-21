import type { FormEvent } from 'react';
import { ICONS } from './storefront.types';
import type { StoreView, UserSession } from './storefront.types';

interface StoreHeaderProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  cartCount: number;
  favoritesCount: number;
  activeUser: UserSession | null;
  activeView: StoreView;
  onNavigate: (view: StoreView) => void;
  onSelectDiscipline: (tag: string, label: string) => void;
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenAccount: () => void;
  onOpenBackoffice: () => void;
}

export function StoreHeader({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  cartCount,
  favoritesCount,
  activeUser,
  activeView,
  onNavigate,
  onSelectDiscipline,
  onOpenMenu,
  onOpenCart,
  onOpenFavorites,
  onOpenAccount,
  onOpenBackoffice,
}: StoreHeaderProps) {
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchSubmit();
  };

  const firstName = activeUser?.nombre.trim().split(/\s+/)[0] || '';

  return (
    <header className="sf-header">
      <div className="sf-promo-bar">
        <p className="sf-promo-bar__text">
          Envío gratis a todo el país | 3 cuotas sin interés
        </p>
      </div>

      <div className="sf-nav-wrap">
        <div className="sf-nav-inner">
          <div className="sf-nav-left">
            <button
              type="button"
              className="sf-icon-btn sf-menu-toggle"
              onClick={onOpenMenu}
              aria-label="Abrir menú de navegación"
            >
              <span className="sf-hamburger" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            <button
              type="button"
              className="sf-brand"
              onClick={() => onNavigate('home')}
              aria-label="Ir al inicio de Sneackers"
            >
              SNEACKERS
            </button>
          </div>

          <nav className="sf-desktop-links" aria-label="Navegación principal">
            <button
              type="button"
              className={`sf-nav-link ${activeView === 'home' ? 'is-active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`sf-nav-link ${activeView === 'catalog' ? 'is-active' : ''}`}
              onClick={() => onNavigate('catalog')}
            >
              Catálogo
            </button>
            <button
              type="button"
              className={`sf-nav-link ${activeView === 'sports' ? 'is-active' : ''}`}
              onClick={() => onNavigate('sports')}
            >
              Deportes
            </button>
            <button
              type="button"
              className="sf-nav-link sf-nav-link--muted"
              onClick={() => onSelectDiscipline('running', 'Running')}
            >
              Running
            </button>
            <button
              type="button"
              className="sf-nav-link sf-nav-link--muted"
              onClick={() => onSelectDiscipline('futbol', 'Fútbol')}
            >
              Fútbol
            </button>
            <button
              type="button"
              className="sf-nav-link sf-nav-link--muted"
              onClick={() => onSelectDiscipline('basquet', 'Básquet')}
            >
              Básquet
            </button>
            <button
              type="button"
              className="sf-nav-link sf-nav-link--muted"
              onClick={() => onSelectDiscipline('urbano', 'Lifestyle / Urbano')}
            >
              Urbanas
            </button>
          </nav>

          <form className="sf-search-form sf-search-form--desktop" onSubmit={handleFormSubmit}>
            <img src={ICONS.search} alt="" aria-hidden="true" className="sf-icon" />
            <input
              type="search"
              className="sf-search-input"
              placeholder="Buscar zapatillas, marcas o deporte..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Buscar en el catálogo"
            />
          </form>

          <div className="sf-nav-utilities">
            {activeUser?.rol === 'administrador' && (
              <button
                type="button"
                className="sf-admin-pill sf-admin-pill--mobile"
                onClick={onOpenBackoffice}
              >
                Admin
              </button>
            )}

            <button
              type="button"
              className="sf-backoffice-link"
              onClick={onOpenBackoffice}
              title="Ir al panel de administración y stock"
            >
              Backoffice
            </button>

            <button
              type="button"
              className={`sf-icon-btn sf-account-btn ${activeView === 'account' || activeView === 'login' ? 'is-active' : ''}`}
              onClick={onOpenAccount}
              aria-label={activeUser ? `Mi cuenta (${firstName})` : 'Iniciar sesión'}
              title={activeUser ? activeUser.nombre : 'Iniciar sesión o crear cuenta'}
            >
              <img src={ICONS.user} alt="" aria-hidden="true" className="sf-icon" />
              {activeUser && <span className="sf-user-status-dot" aria-hidden="true" />}
              {firstName && <span className="sf-account-name">{firstName}</span>}
            </button>

            <button
              type="button"
              className={`sf-icon-btn ${activeView === 'favorites' ? 'is-active' : ''}`}
              onClick={onOpenFavorites}
              aria-label={`Favoritos (${favoritesCount})`}
              title="Mis favoritos"
            >
              <img src={ICONS.heart} alt="" aria-hidden="true" className="sf-icon" />
              {favoritesCount > 0 && <span className="sf-badge">{favoritesCount}</span>}
            </button>

            <button
              type="button"
              className="sf-icon-btn"
              onClick={onOpenCart}
              aria-label={`Carrito (${cartCount})`}
              title="Ver carrito"
            >
              <img src={ICONS.cart} alt="" aria-hidden="true" className="sf-icon" />
              {cartCount > 0 && <span className="sf-badge sf-badge--red">{cartCount}</span>}
            </button>
          </div>
        </div>

        <form className="sf-search-form sf-search-form--mobile" onSubmit={handleFormSubmit}>
          <img src={ICONS.search} alt="" aria-hidden="true" className="sf-icon" />
          <input
            type="search"
            className="sf-search-input"
            placeholder="Buscar zapatillas, marcas o deporte..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar productos"
          />
        </form>
      </div>
    </header>
  );
}
