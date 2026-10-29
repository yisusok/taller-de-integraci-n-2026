import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../Register/RegisterForm.css';

interface PublicUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  avatar?: string | null;
}

interface LoginFormProps {
  apiBaseUrl?: string;
  onGoToRegister: () => void;
  onForgotPassword: () => void;
  onSuccess?: (user: PublicUser) => void;
}

const defaultApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const LoginForm: React.FC<LoginFormProps> = ({
  apiBaseUrl = defaultApiUrl,
  onGoToRegister,
  onForgotPassword,
  onSuccess,
}) => {
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const handleLocalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorServidor(null);

    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio || !password) {
      setErrorServidor('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpio, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Demasiados intentos fallidos. Por favor espera unos minutos.');
        }
        const msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        throw new Error(msg || 'Credenciales incorrectas');
      }

      if (onSuccess && data?.user) {
        onSuccess(data.user);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorServidor(e.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-clean-wrapper" id="login-form-card">
      <div className="auth-clean-header">
        <span className="auth-clean-tag">Acceso</span>
        <h2 className="auth-clean-title">Iniciar Sesión</h2>
        <p className="auth-clean-subtitle">
          Accede a tu cuenta para continuar con tus compras y pedidos
        </p>
      </div>

      {errorServidor && (
        <div className="clean-alert clean-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          <div>
            <strong>Error:</strong> {errorServidor}
          </div>
        </div>
      )}

      {/* Formulario de Login Local */}
      <form onSubmit={handleLocalLogin} className="auth-clean-form" noValidate>
        <div className="auth-clean-field">
          <label className="auth-clean-label" htmlFor="login-input-email">
            Correo Electrónico
          </label>
          <input
            id="login-input-email"
            type="email"
            className="auth-clean-input"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="auth-clean-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="auth-clean-label" htmlFor="login-input-password">
              Contraseña
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              id="btn-login-forgot-password-link"
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="auth-input-password-wrapper" style={{ position: 'relative' }}>
            <input
              id="login-input-password"
              type={mostrarPassword ? 'text' : 'password'}
              className="auth-clean-input"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={cargando}
              required
            />
            <button
              type="button"
              className="clean-show-pass-btn"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              tabIndex={-1}
            >
              {mostrarPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="clean-submit-btn"
          id="btn-login-submit"
          disabled={cargando}
          style={{ marginTop: '0.5rem' }}
        >
          {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="auth-clean-divider" style={{ margin: '1.25rem 0' }}>
        <span>o continuar con</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Acceso directo con Google */}
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
          disabled={auth0Loading}
          style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
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
          Google
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
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
    </div>
  );
};
