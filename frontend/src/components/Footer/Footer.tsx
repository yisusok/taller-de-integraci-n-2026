import { useAuth0 } from '@auth0/auth0-react';
import './Footer.css';
interface FooterProps {
    onNavigate?: (tab: 'register' | 'overview') => void;
}
export const Footer = ({ onNavigate }: FooterProps) => {
    const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-grid">
                    <div className="footer-column">
                        <h4 className="footer-title">AYUDA</h4>
                        <ul className="footer-links">
                            <li><a href="#faq">Preguntas Frecuentes</a></li>
                            <li><a href="#devoluciones">Cambios y Devoluciones</a></li>
                            <li><a href="#envios">Envíos</a></li>
                            <li><a href="#soporte">Soporte de Calzado</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">MI CUENTA</h4>
                        <ul className="footer-links">
                            <li>
                                {isAuthenticated ? (
                                    <a
                                        href="#logout"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            logout({ logoutParams: { returnTo: window.location.origin } });
                                        }}
                                    >
                                        Cerrar Sesión
                                    </a>
                                ) : (
                                    <a
                                        href="#login"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            loginWithRedirect();
                                        }}
                                    >
                                        Iniciar Sesión
                                    </a>
                                )}
                            </li>
                            <li>
                                <a
                                    href="#register"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate?.('register');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    Registrarse
                                </a>
                            </li>
                            <li><a href="#pedidos">Mis Pedidos</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">INFORMACIÓN</h4>
                        <ul className="footer-links">
                            <li><a href="#nosotros">Nosotros</a></li>
                            <li><a href="#terminos">Términos y Condiciones</a></li>
                            <li><a href="#privacidad">Políticas de Privacidad</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">SÍGUENOS</h4>
                        <ul className="footer-links">
                            <li><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
                            <li><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
                            <li><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
                            <li><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></li>
                        </ul>
                    </div>
                </div>

                <hr className="footer-divider" />

                <div className="footer-bottom">
                    <p className="copyright">
                        © 2026 Calzado Deportivo. Todos los derechos reservados. Industria Argentina.
                    </p>
                </div>
            </div>
        </footer>
    );
};