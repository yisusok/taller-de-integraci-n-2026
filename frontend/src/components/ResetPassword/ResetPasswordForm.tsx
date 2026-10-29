import React, { useState } from 'react';
import '../Register/RegisterForm.css';

interface ResetPasswordFormProps {
  apiBaseUrl?: string;
  initialToken?: string;
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

const defaultApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  apiBaseUrl = defaultApiUrl,
  initialToken = '',
  onBackToLogin,
  onSuccess,
}) => {
  // Detectar token inicial de props o URL (?token=...)
  const [token, setToken] = useState(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [enlacePrueba, setEnlacePrueba] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});

  // Indicadores de fortaleza de contraseña en tiempo real
  const tieneMinimo = newPassword.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(newPassword);
  const tieneMinuscula = /[a-z]/.test(newPassword);
  const tieneNumeroOSimbolo = /[\d\W]/.test(newPassword);
  const passwordsCoinciden = newPassword.length > 0 && newPassword === confirmPassword;

  // Modo 1: Solicitar enlace de recuperación (Forgot Password)
  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorServidor(null);
    setMensajeExito(null);
    setEnlacePrueba(null);

    const emailLimpio = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailLimpio) {
      setErroresCampos({ email: 'El correo electrónico es obligatorio.' });
      return;
    }
    if (!emailRegex.test(emailLimpio)) {
      setErroresCampos({ email: 'Ingresa un correo con formato válido.' });
      return;
    }

    setErroresCampos({});
    setCargando(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpio }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Has superado el límite de solicitudes. Por favor espera 15 minutos antes de intentar nuevamente.');
        }
        const msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        throw new Error(msg || 'Error al solicitar el enlace de recuperación.');
      }

      setMensajeExito(data.message || 'Si el correo está registrado, se enviará un enlace de recuperación.');

      if (data.previewUrl) {
        setEnlacePrueba(data.previewUrl);
      } else if (data.token) {
        setEnlacePrueba(data.token);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorServidor(e.message || 'Ocurrió un error inesperado.');
    } finally {
      setCargando(false);
    }
  };

  // Modo 2: Redefinir la contraseña con el token (Reset Password)
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorServidor(null);
    setMensajeExito(null);

    const nuevosErrores: Record<string, string> = {};
    if (!token.trim()) {
      nuevosErrores.token = 'El token de recuperación es obligatorio.';
    }

    if (!newPassword) {
      nuevosErrores.newPassword = 'La nueva contraseña es obligatoria.';
    } else if (!tieneMinimo || !tieneMayuscula || !tieneMinuscula || !tieneNumeroOSimbolo) {
      nuevosErrores.newPassword =
        'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula y un número o símbolo.';
    }

    if (!confirmPassword) {
      nuevosErrores.confirmPassword = 'Debes confirmar la nueva contraseña.';
    } else if (newPassword !== confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      return;
    }

    setErroresCampos({});
    setCargando(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Has superado el límite de intentos de actualización. Espera unos minutos.');
        }
        const msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        throw new Error(msg || 'Error al actualizar la contraseña.');
      }

      setMensajeExito(data.message || 'Contraseña actualizada exitosamente.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorServidor(e.message || 'Ocurrió un error inesperado al actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de éxito tras redefinir contraseña
  if (mensajeExito && token) {
    return (
      <div className="auth-clean-wrapper" id="reset-success-card">
        <div className="auth-clean-header">
          <span className="auth-clean-tag" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
            ● Listo
          </span>
          <h2 className="auth-clean-title">Contraseña Actualizada</h2>
          <p className="auth-clean-subtitle">{mensajeExito}</p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => {
              // Limpiar query params de la URL
              window.history.replaceState({}, document.title, window.location.pathname);
              if (onBackToLogin) onBackToLogin();
            }}
            className="clean-submit-btn"
            id="btn-go-to-login"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Si tenemos un token: Vista para Redefinir Contraseña
  if (token) {
    return (
      <div className="auth-clean-wrapper" id="reset-password-card">
        <div className="auth-clean-header">
          <span className="auth-clean-tag">Seguridad Corporativa</span>
          <h2 className="auth-clean-title">Redefinir Contraseña</h2>
          <p className="auth-clean-subtitle">
            Ingresa tu nueva contraseña para restaurar el acceso a tu cuenta.
          </p>
        </div>

        {errorServidor && (
          <div className="clean-alert clean-alert-error" role="alert" id="reset-server-error">
            <div>
              <strong>Error:</strong> {errorServidor}
            </div>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="auth-clean-form" noValidate>
          <div className="auth-clean-field">
            <label className="auth-clean-label" htmlFor="input-new-password">
              Nueva Contraseña
            </label>
            <div className="auth-input-password-wrapper" style={{ position: 'relative' }}>
              <input
                id="input-new-password"
                type={mostrarContrasena ? 'text' : 'password'}
                className={`auth-clean-input ${erroresCampos.newPassword ? 'input-error' : ''}`}
                placeholder="Mínimo 8 caracteres (mayús, minús, núm/símbolo)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (erroresCampos.newPassword) {
                    setErroresCampos((prev) => ({ ...prev, newPassword: '' }));
                  }
                }}
                disabled={cargando}
                required
              />
              <button
                type="button"
                className="clean-show-pass-btn"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                tabIndex={-1}
              >
                {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {erroresCampos.newPassword && (
              <span className="clean-error-text">{erroresCampos.newPassword}</span>
            )}

            {/* Checklist visual de requisitos de seguridad */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ color: tieneMinimo ? '#059669' : '#9ca3af' }}>
                  {tieneMinimo ? '✓' : '○'} Mínimo 8 caracteres
                </span>
                <span style={{ color: tieneMayuscula && tieneMinuscula ? '#059669' : '#9ca3af' }}>
                  {tieneMayuscula && tieneMinuscula ? '✓' : '○'} Letra mayúscula y minúscula
                </span>
                <span style={{ color: tieneNumeroOSimbolo ? '#059669' : '#9ca3af' }}>
                  {tieneNumeroOSimbolo ? '✓' : '○'} Al menos un número o símbolo especial
                </span>
              </div>
            )}
          </div>

          <div className="auth-clean-field">
            <label className="auth-clean-label" htmlFor="input-confirm-new-password">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="input-confirm-new-password"
              type={mostrarContrasena ? 'text' : 'password'}
              className={`auth-clean-input ${erroresCampos.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (erroresCampos.confirmPassword) {
                  setErroresCampos((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              disabled={cargando}
              required
            />
            {erroresCampos.confirmPassword && (
              <span className="clean-error-text">{erroresCampos.confirmPassword}</span>
            )}
            {confirmPassword.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: passwordsCoinciden ? '#059669' : '#dc2626', marginTop: '0.25rem' }}>
                {passwordsCoinciden ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="clean-submit-btn"
            id="btn-submit-reset-password"
            disabled={cargando}
          >
            {cargando ? 'Actualizando...' : 'Restablecer Contraseña'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setToken('');
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline',
              }}
            >
              ¿Solicitar otro enlace?
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Si no tenemos token: Vista para Solicitar Enlace (Forgot Password)
  return (
    <div className="auth-clean-wrapper" id="forgot-password-card">
      <div className="auth-clean-header">
        <span className="auth-clean-tag">Recuperación</span>
        <h2 className="auth-clean-title">¿Olvidaste tu contraseña?</h2>
        <p className="auth-clean-subtitle">
          Ingresa tu correo electrónico registrado y te enviaremos un enlace temporal seguro para redefinirla.
        </p>
      </div>

      {mensajeExito && (
        <div className="clean-alert clean-alert-success" role="alert" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '6px' }}>
          <div>
            <strong>✓ Solicitud Procesada:</strong> {mensajeExito}
          </div>
          {enlacePrueba && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #6ee7b7' }}>
              {enlacePrueba.startsWith('http') ? (
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#047857' }}>Correo enviado vía Ethereal: </span>
                  <a
                    href={enlacePrueba}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#047857',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'inline-block',
                      marginLeft: '0.5rem',
                    }}
                  >
                    Ver correo en bandeja de entrada ↗
                  </a>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#047857' }}>Token de prueba detectado: </span>
                  <button
                    type="button"
                    onClick={() => setToken(enlacePrueba)}
                    style={{
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginLeft: '0.5rem',
                    }}
                  >
                    Abrir pantalla para redefinir contraseña
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {errorServidor && (
        <div className="clean-alert clean-alert-error" role="alert" id="forgot-server-error">
          <div>
            <strong>Error:</strong> {errorServidor}
          </div>
        </div>
      )}

      <form onSubmit={handleRequestReset} className="auth-clean-form" noValidate>
        <div className="auth-clean-field">
          <label className="auth-clean-label" htmlFor="input-forgot-email">
            Correo Electrónico
          </label>
          <input
            id="input-forgot-email"
            type="email"
            className={`auth-clean-input ${erroresCampos.email ? 'input-error' : ''}`}
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (erroresCampos.email) {
                setErroresCampos((prev) => ({ ...prev, email: '' }));
              }
            }}
            disabled={cargando}
            required
          />
          {erroresCampos.email && (
            <span className="clean-error-text">{erroresCampos.email}</span>
          )}
        </div>

        <button
          type="submit"
          className="clean-submit-btn"
          id="btn-submit-forgot-password"
          disabled={cargando}
        >
          {cargando ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
        </button>

        {onBackToLogin && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#111827',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              ← Volver al inicio / registro
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
