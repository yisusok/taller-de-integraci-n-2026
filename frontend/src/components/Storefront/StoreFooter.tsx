import type { StoreView, UserSession } from './storefront.types';

interface StoreFooterProps {
  activeUser: UserSession | null;
  onNavigate: (view: StoreView) => void;
  onOpenCatalog: () => void;
  onOpenFavorites: () => void;
  onOpenBackoffice: () => void;
  onLogout: () => void;
}

export function StoreFooter({
  activeUser,
  onNavigate,
  onOpenCatalog,
  onOpenFavorites,
  onOpenBackoffice,
  onLogout,
}: StoreFooterProps) {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="sf-footer">
      <div className="sf-container">
        <div className="sf-footer__grid">
          <div className="sf-footer__col">
            <h3 className="sf-footer__heading">AYUDA</h3>
            <ul className="sf-footer__list">
              <li>
                <button
                  type="button"
                  className="sf-footer__link"
                  onClick={() => {
                    onNavigate('sports');
                    scrollToTop();
                  }}
                >
                  Disciplinas deportivas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sf-footer__link"
                  onClick={() => {
                    onOpenCatalog();
                    scrollToTop();
                  }}
                >
                  Catálogo completo
                </button>
              </li>
              <li>
                <span>Envíos a todo el país</span>
              </li>
              <li>
                <span>Soporte de calzado</span>
              </li>
            </ul>
          </div>

          <div className="sf-footer__col">
            <h3 className="sf-footer__heading">MI CUENTA</h3>
            <ul className="sf-footer__list">
              {activeUser ? (
                <>
                  <li>
                    <button
                      type="button"
                      className="sf-footer__link"
                      onClick={() => {
                        onNavigate('account');
                        scrollToTop();
                      }}
                    >
                      Mi perfil y domicilios
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="sf-footer__link"
                      onClick={() => {
                        onLogout();
                        scrollToTop();
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      className="sf-footer__link"
                      onClick={() => {
                        onNavigate('login');
                        scrollToTop();
                      }}
                    >
                      Iniciar Sesión
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="sf-footer__link"
                      onClick={() => {
                        onNavigate('register');
                        scrollToTop();
                      }}
                    >
                      Registrarse
                    </button>
                  </li>
                </>
              )}
              <li>
                <button
                  type="button"
                  className="sf-footer__link"
                  onClick={() => {
                    onOpenFavorites();
                    scrollToTop();
                  }}
                >
                  Lista de Deseos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sf-footer__link"
                  onClick={() => {
                    onOpenBackoffice();
                    scrollToTop();
                  }}
                >
                  Panel administrativo
                </button>
              </li>
            </ul>
          </div>

          <div className="sf-footer__col">
            <h3 className="sf-footer__heading">INFORMACIÓN</h3>
            <ul className="sf-footer__list">
              <li>
                <span>Concepción del Uruguay, ER</span>
              </li>
              <li>
                <span>Términos y Condiciones</span>
              </li>
              <li>
                <span>Políticas de Privacidad</span>
              </li>
              <li>
                <span>Atención por soporte</span>
              </li>
            </ul>
          </div>

          <div className="sf-footer__col">
            <h3 className="sf-footer__heading">SÍGUENOS</h3>
            <ul className="sf-footer__list">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noreferrer">
                  YouTube
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="sf-footer__divider" />

        <div className="sf-footer__bottom">
          <p className="sf-footer__copy">
            © 2026 Sneackers · Calzado Deportivo. Todos los derechos reservados. Industria Argentina.
          </p>
          <div className="sf-payment-badges" aria-label="Medios de pago">
            <span className="sf-payment-badge">VISA</span>
            <span className="sf-payment-badge">MASTERCARD</span>
            <span className="sf-payment-badge">AMEX</span>
            <span className="sf-payment-badge">MERCADO PAGO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
