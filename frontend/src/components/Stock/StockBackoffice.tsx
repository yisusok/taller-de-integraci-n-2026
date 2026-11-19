import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout/AdminLayout';
import type { AdminNavGroup } from '../AdminLayout/AdminLayout';
import { ExtractionSection } from './ExtractionSection';
import { LedgerSection } from './LedgerSection';
import { AlertsSection } from './AlertsSection';
import { stockApi } from './api';
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

type SectionId = 'extraccion' | 'historial' | 'alertas';

export function StockBackoffice({
  activeUser,
  onGoToStore,
  onGoToLogin,
  onLogout,
}: StockBackofficeProps) {
  const [section, setSection] = useState<SectionId>('extraccion');
  const [prefill, setPrefill] = useState<{ varianteId: string; nonce: number } | null>(null);
  const [ledgerPrefill, setLedgerPrefill] = useState<{ varianteId: string; nonce: number } | null>(null);
  const [alertCount, setAlertCount] = useState<number | undefined>(undefined);

  const isAdmin = activeUser?.rol === 'administrador';

  useEffect(() => {
    if (!isAdmin) return;
    stockApi
      .getAlerts()
      .then((res) => setAlertCount(res.total_alertas))
      .catch(() => {
        // Silencioso si aún no hay backend o sin conexión
      });
  }, [isAdmin]);

  const navGroups: AdminNavGroup[] = [
    {
      label: 'Inventario',
      items: [
        { id: 'extraccion', label: 'Extracción manual' },
        { id: 'historial', label: 'Libro mayor' },
        {
          id: 'alertas',
          label: 'Alertas de stock',
          badge: alertCount !== undefined && alertCount > 0 ? alertCount : undefined,
        },
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

  const userLabel = !activeUser
    ? 'Sin sesión iniciada'
    : isAdmin
      ? `Administrador autorizado · ${activeUser.nombre}`
      : `${activeUser.nombre} · sin permisos de administrador`;

  const openExtractionFor = (varianteId: string) => {
    setPrefill({ varianteId, nonce: Date.now() });
    setSection('extraccion');
  };

  const openLedgerFor = (varianteId: string) => {
    setLedgerPrefill({ varianteId, nonce: Date.now() });
    setSection('historial');
  };

  return (
    <AdminLayout
      userLabel={userLabel}
      navGroups={navGroups}
      activeId={section}
      onSelect={(id) => setSection(id as SectionId)}
      onGoToStore={onGoToStore}
      onLogout={activeUser ? onLogout : undefined}
      onLogin={onGoToLogin}
      sidebarNote="Acceso restringido a personal autorizado. Gestioná el inventario desde este panel."
      footerLines={[
        '© 2026 Calzado Deportivo · Panel de administración',
        'Gestión de inventario y alertas de reposición',
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
      ) : section === 'historial' ? (
        <LedgerSection
          key={ledgerPrefill?.nonce ?? 'ledger-initial'}
          initialVarianteId={ledgerPrefill?.varianteId}
          onSelectVariant={openExtractionFor}
        />
      ) : (
        <AlertsSection
          onSelectExtraction={openExtractionFor}
          onSelectLedger={openLedgerFor}
          onAlertCountChange={setAlertCount}
        />
      )}
    </AdminLayout>
  );
}

