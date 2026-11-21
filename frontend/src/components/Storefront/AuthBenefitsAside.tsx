import { ICONS } from './storefront.types';

export function AuthBenefitsAside() {
  return (
    <aside className="sf-auth-aside" aria-label="Beneficios de tu cuenta">
      <h2 className="sf-auth-aside__title">TU DEPORTE, EN UN SOLO LUGAR.</h2>

      <ul className="sf-auth-benefits">
        <li>
          <span className="sf-auth-benefits__check" aria-hidden="true">
            ✓
          </span>
          <span>Guarda el calzado que más te gusta.</span>
        </li>
        <li>
          <span className="sf-auth-benefits__check" aria-hidden="true">
            ✓
          </span>
          <span>Compra sin volver a completar tus datos.</span>
        </li>
        <li>
          <span className="sf-auth-benefits__check" aria-hidden="true">
            ✓
          </span>
          <span>Consulta el estado y la entrega de tus pedidos.</span>
        </li>
      </ul>

      <div className="sf-notice-card">
        <img src={ICONS.shieldCheck} alt="" aria-hidden="true" className="sf-icon" />
        <div className="sf-notice-card__body">
          <strong>Acceso de administrador</strong>
          <p>
            Usa este mismo formulario con tus credenciales autorizadas. Solo las cuentas habilitadas pueden acceder al panel administrativo; el registro público no otorga permisos.
          </p>
        </div>
      </div>

      <p className="sf-auth-aside__footnote">
        Tus datos se utilizan únicamente para gestionar tu cuenta y tus compras.
      </p>
    </aside>
  );
}
