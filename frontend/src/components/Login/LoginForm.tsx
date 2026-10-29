import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../Register/RegisterForm.css';

interface LoginFormProps {
  onGoToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onGoToRegister,
  onForgotPassword,
}) => {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <div className="auth-clean-wrapper" id="login-form-card">
      <div className="auth-clean-header">
        <span className="auth-clean-tag">Acceso</span>
        <h2 className="auth-clean-title">Iniciar Sesión</h2>
        <p className="auth-clean-subtitle">
          Accede a tu cuenta para continuar con tus compras y pedidos
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Acceso directo con Google (omite pantalla intermedia de Auth0) */}
        <button
          type="button"
          onClick={() =>
            loginWithRedirect({
              authorizationParams: {
                connection: 'google-oauth2',
              },
            })
          }
          className="auth-google-btn"
          id="btn-login-google-direct"
          disabled={isLoading}
          style={{ padding: '0.85rem 1rem', fontSize: '0.95rem' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="auth-clean-divider">
          <span>o con correo y contraseña</span>
        </div>

        <button
          type="button"
          onClick={() => loginWithRedirect()}
          className="clean-submit-btn"
          id="btn-login-auth0"
          disabled={isLoading}
          style={{ background: '#1f2937' }}
        >
          Iniciar sesión con Correo / Auth0
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          ¿No tienes una cuenta aún?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            id="btn-go-to-register"
            style={{
              background: 'none',
              border: 'none',
              color: '#111827',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Regístrate aquí
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <button
            type="button"
            onClick={onForgotPassword}
            id="btn-login-forgot-password"
            style={{
              background: 'none',
              border: 'none',
              color: '#4f46e5',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.85rem',
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
};
