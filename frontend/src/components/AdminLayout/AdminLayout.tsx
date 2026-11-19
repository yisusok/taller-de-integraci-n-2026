import type { ReactNode } from 'react';
import './AdminLayout.css';

export interface AdminNavItem {
  id: string;
  label: string;
  disabled?: boolean;
  tag?: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

interface AdminLayoutProps {
  userLabel: string;
  navGroups: AdminNavGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  onGoToStore?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  sidebarNote?: string;
  footerLines?: string[];
  children: ReactNode;
}

export function AdminLayout({
  userLabel,
  navGroups,
  activeId,
  onSelect,
  onGoToStore,
  onLogout,
  onLogin,
  sidebarNote,
  footerLines = ['© 2026 Calzado Deportivo · Panel de administración'],
  children,
}: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <p className="admin-header__brand">Administración</p>
        <div className="admin-header__session">
          <p className="admin-header__user">{userLabel}</p>
          <div className="admin-header__actions">
            {onGoToStore && (
              <button type="button" className="admin-header__link" onClick={onGoToStore}>
                Ver tienda ↗
              </button>
            )}
            {onLogout ? (
              <button type="button" className="admin-header__link" onClick={onLogout}>
                Cerrar sesión
              </button>
            ) : (
              onLogin && (
                <button type="button" className="admin-header__link" onClick={onLogin}>
                  Iniciar sesión
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav" aria-label="Navegación administrativa">
          {navGroups.map((group) => (
            <div key={group.label} className="admin-nav__group">
              <p className="admin-nav__label">{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  aria-current={item.id === activeId ? 'page' : undefined}
                  className={`admin-nav__item ${item.id === activeId ? 'admin-nav__item--active' : ''}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span>{item.label}</span>
                  {item.tag && <span className="admin-nav__tag">{item.tag}</span>}
                </button>
              ))}
            </div>
          ))}
          {sidebarNote && (
            <>
              <hr className="admin-nav__divider" />
              <p className="admin-nav__note">{sidebarNote}</p>
            </>
          )}
        </nav>

        <main className="admin-main">{children}</main>
      </div>

      <footer className="admin-footer">
        {footerLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </footer>
    </div>
  );
}

interface AdminPageHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function AdminPageHeading({ eyebrow, title, subtitle }: AdminPageHeadingProps) {
  return (
    <div className="admin-heading">
      <p className="admin-eyebrow">{eyebrow}</p>
      <h1 className="admin-title">{title}</h1>
      {subtitle && <p className="admin-subtitle">{subtitle}</p>}
    </div>
  );
}
