import { useEffect } from 'react';
import type { StoreView, UserSession } from './storefront.types';

interface StoreNavDrawerProps {
  open: boolean;
  onClose: () => void;
  activeUser: UserSession | null;
  favoritesCount: number;
  onSelectDiscipline: (tag: string, label: string) => void;
  onOpenCatalog: () => void;
  onOpenCombos: () => void;
  onOpenFavorites: () => void;
  onNavigate: (view: StoreView) => void;
  onOpenBackoffice: () => void;
  onLogout: () => void;
}

export function StoreNavDrawer({
  open,
  onClose,
  activeUser,
  favoritesCount,
  onSelectDiscipline,
  onOpenCatalog,
  onOpenCombos,
  onOpenFavorites,
  onNavigate,
  onOpenBackoffice,
  onLogout,
}: StoreNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="sf-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="sf-drawer sf-drawer--left"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sf-drawer__header">
          <h2 className="sf-drawer__title">MENÚ</h2>
          <button
            type="button"
            className="sf-drawer__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <div className="sf-menu-list">
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('running', 'Running');
              onClose();
            }}
          >
            RUNNING
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('training', 'Training / Gimnasio');
              onClose();
            }}
          >
            TRAINING
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('futbol', 'Fútbol');
              onClose();
            }}
          >
            FÚTBOL
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('basquet', 'Básquet');
              onClose();
            }}
          >
            BÁSQUET
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('tenis', 'Tenis / Padel');
              onClose();
            }}
          >
            TENIS
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onSelectDiscipline('urbano', 'Lifestyle / Urbano');
              onClose();
            }}
          >
            LIFESTYLE / URBANAS
          </button>
          <button
            type="button"
            className="sf-menu-item"
            onClick={() => {
              onOpenCatalog();
              onClose();
            }}
          >
            VER TODO EL CATÁLOGO
          </button>
          <button
            type="button"
            className="sf-menu-item sf-menu-item--highlight"
            onClick={() => {
              onOpenFavorites();
              onClose();
            }}
          >
            FAVORITOS ({favoritesCount})
          </button>
          <button
            type="button"
            className="sf-menu-item sf-menu-item--highlight"
            onClick={() => {
              onOpenCombos();
              onClose();
            }}
          >
            COMBOS Y PROMOCIONES
          </button>
        </div>

        <hr className="sf-divider" />

        <div className="sf-menu-secondary">
          {activeUser ? (
            <>
              <button
                type="button"
                className="sf-menu-subitem"
                onClick={() => {
                  onNavigate('account');
                  onClose();
                }}
              >
                Mi perfil y domicilios ({activeUser.nombre.split(' ')[0]})
              </button>
              <button
                type="button"
                className="sf-menu-subitem"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="sf-menu-subitem"
                onClick={() => {
                  onNavigate('login');
                  onClose();
                }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className="sf-menu-subitem"
                onClick={() => {
                  onNavigate('register');
                  onClose();
                }}
              >
                Crear cuenta
              </button>
            </>
          )}
          <button
            type="button"
            className="sf-menu-subitem"
            onClick={() => {
              onNavigate('sports');
              onClose();
            }}
          >
            Deportes y disciplinas
          </button>
          <button
            type="button"
            className="sf-menu-subitem"
            onClick={() => {
              onOpenBackoffice();
              onClose();
            }}
          >
            Panel administrativo (Backoffice)
          </button>
        </div>
      </aside>
    </div>
  );
}
