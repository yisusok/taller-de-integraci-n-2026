import { useState } from 'react';
import { AdminLayout } from '../AdminLayout/AdminLayout';
import type { AdminNavGroup } from '../AdminLayout/AdminLayout';
import { ExtractionSection } from './ExtractionSection';
import { LedgerSection } from './LedgerSection';
import './Stock.css';

export interface AdminSessionUser {
  nombre: string;
  rol?: string;
}

interface StockBackofficeProps {
  activeUser: AdminSessionUser | null;
  onGoToStore: () => void;
  onGoToLogin: () => void;
  onLogout: () => void;
}

type SectionId = 'extraccion' | 'historial';

const NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Inventario',
    items: [
      { id: 'extraccion', label: 'Extracción manual' },
      { id: 'historial', label: 'Libro mayor' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'productos', label: 'Productos', disabled: true, tag: 'Próximamente' },
      { id: 'combos', label: 'Combos y promociones', disabled: true, tag: 'Próximamente' },
      { id: 'categorias', label: 'Categorías y marcas', disabled: true, tag: 'Próximamente' },
    ],
  },
];

export function StockBackoffice({
  activeUser,
  onGoToStore,
  onGoToLogin,
  onLogout,
}: StockBackofficeProps) {
  const [section, setSection] = useState<SectionId>('extraccion');
  const [prefill, setPrefill] = useState<{ varianteId: string; nonce: number } | null>(null);

  const isAdmin = activeUser?.rol === 'administrador';

  const userLabel = !activeUser
    ? 'Sin sesión iniciada'
    : isAdmin
      ? `Administrador autorizado · ${activeUser.nombre}`
      : `${activeUser.nombre} · sin permisos de administrador`;

  const openExtractionFor = (varianteId: string) => {
    setPrefill({ varianteId, nonce: Date.now() });
    setSection('extraccion');
  };

  return (
    <AdminLayout
      userLabel={userLabel}
      navGroups={NAV_GROUPS}
      activeId={section}
      onSelect={(id) => setSection(id as SectionId)}
      onGoToStore={onGoToStore}
      onLogout={activeUser ? onLogout : undefined}
      onLogin={onGoToLogin}
      sidebarNote="Acceso restringido a personal autorizado. Gestioná el inventario desde este panel."
      footerLines={[
        '© 2026 Calzado Deportivo · Panel de administración',
        'Gestión de inventario',
      ]}
    >
      {!isAdmin ? (
        <section className="admin-panel stock-restricted">
          <h2 className="admin-panel__title">Acceso restringido</h2>
          <p className="admin-panel__helper">
            Esta sección es solo para cuentas con rol <strong>administrador</strong>.{' '}
            {activeUser
              ? 'Tu cuenta actual no tiene ese permiso.'
              : 'Iniciá sesión con una cuenta autorizada para continuar.'}
          </p>
          <div className="admin-actions">
            {!activeUser && (
              <button type="button" className="admin-btn admin-btn--primary" onClick={onGoToLogin}>
                Iniciar sesión
              </button>
            )}
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onGoToStore}>
              Volver a la tienda
            </button>
          </div>
        </section>
      ) : section === 'extraccion' ? (
        <ExtractionSection
          key={prefill?.nonce ?? 'initial'}
          initialVarianteId={prefill?.varianteId}
          onOpenLedger={() => setSection('historial')}
        />
      ) : (
        <LedgerSection onSelectVariant={openExtractionFor} />
      )}
    </AdminLayout>
  );
}
