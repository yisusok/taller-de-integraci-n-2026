import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './RegisterForm.css';

export interface UsuarioCreado {
  id: string;
  nombre: string;
  correo_electronico: string;
  rol: string;
  fechaCreacion?: string;
}

interface RegisterFormProps {
  apiBaseUrl?: string;
  onSuccess?: (usuario: UsuarioCreado) => void;
  onGoToLogin?: () => void;
}

const defaultApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const RegisterForm: React.FC<RegisterFormProps> = ({
  apiBaseUrl = defaultApiUrl,
  onSuccess,
  onGoToLogin,
}) => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading: authLoading } = useAuth0();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const [usuarioRegistrado, setUsuarioRegistrado] = useState<UsuarioCreado | null>(null);
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetch(`${apiBaseUrl}/auth/sync-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          nombre: user.name || user.nickname || 'Usuario Google',
          avatar: user.picture || null,
          providerId: user.sub || null,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Error al sincronizar con el servidor');
          return res.json();
        })
        .then((data) => {
          console.log('Usuario OAuth sincronizado en PostgreSQL:', data);
          if (onSuccess && data?.id) {
            onSuccess({
              id: data.id,
              nombre: data.nombre,
              correo_electronico: data.email,
              rol: data.rol,
              fechaCreacion: data.createdAt,
            });
          }
        })
        .catch((err) => console.error('Error al sincronizar:', err));
    }
  }, [isAuthenticated, user, apiBaseUrl, onSuccess]);

  const sanearInputs = () => {
    return {
      nombreSaneado: nombre.trim(),
      emailSaneado: email.trim().toLowerCase(),
      contrasenaLimpia: contrasena,
    };
  };



  const validarFormulario = (): boolean => {
    const { nombreSaneado, emailSaneado, contrasenaLimpia } = sanearInputs();
    const nuevosErrores: Record<string, string> = {};

    if (!nombreSaneado) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (nombreSaneado.length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailSaneado) {
      nuevosErrores.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(emailSaneado)) {
      nuevosErrores.email = 'Ingresa un correo electrónico con formato válido.';
    }

    if (!contrasenaLimpia) {
      nuevosErrores.contrasena = 'La contraseña es obligatoria.';
    } else if (contrasenaLimpia.length < 8) {
      nuevosErrores.contrasena = 'La contraseña debe tener un mínimo de 8 caracteres.';
    }

    if (contrasenaLimpia !== confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden.';
    }

    setErroresCampos(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorServidor(null);

    if (!validarFormulario()) {
      return;
    }

    const { nombreSaneado, emailSaneado, contrasenaLimpia } = sanearInputs();
    setCargando(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombreSaneado,
          correo_electronico: emailSaneado,
          contrasena: contrasenaLimpia,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrorServidor(
            data.message || 'El correo electrónico ya se encuentra registrado. Utiliza otro correo.',
          );
          setErroresCampos((prev) => ({
            ...prev,
            email: 'Este correo ya pertenece a una cuenta registrada.',
          }));
        } else if (response.status === 400) {
          const mensajes = Array.isArray(data.message) ? data.message.join('. ') : data.message;
          setErrorServidor(mensajes || 'Error de validación en los datos ingresados.');
        } else {
          setErrorServidor(
            data.message || `Ocurrió un error inesperado al procesar la solicitud (${response.status}).`,
          );
        }
        return;
      }

      setUsuarioRegistrado(data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch {
      setErrorServidor(
        `No se pudo conectar con el servidor backend (${apiBaseUrl}). Verifica que el backend NestJS esté activo en el puerto 3000.`,
      );
    } finally {
      setCargando(false);
    }
  };

  const reiniciarFormulario = () => {
    setNombre('');
    setEmail('');
    setContrasena('');
    setConfirmarContrasena('');
    setUsuarioRegistrado(null);
    setErrorServidor(null);
    setErroresCampos({});
  };

  if (usuarioRegistrado) {
    return (
      <div className="auth-clean-wrapper" id="register-success-card">
        <div className="auth-clean-success">
          <div className="clean-success-badge">✓</div>
          <h2 className="auth-clean-title">¡Cuenta Creada!</h2>
          <p className="auth-clean-subtitle">
            Tu registro ha sido procesado exitosamente.
          </p>

          <div className="clean-details-list">
            <div className="clean-detail-item">
              <span>Nombre:</span>
              <span>{usuarioRegistrado.nombre}</span>
            </div>
            <div className="clean-detail-item">
              <span>Correo:</span>
              <span>{usuarioRegistrado.correo_electronico}</span>
            </div>
            <div className="clean-detail-item">
              <span>ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{usuarioRegistrado.id}</span>
            </div>
            <div className="clean-detail-item">
              <span>Rol:</span>
              <span style={{ textTransform: 'uppercase' }}>{usuarioRegistrado.rol}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={reiniciarFormulario}
              className="clean-submit-btn"
              style={{ background: '#374151' }}
            >
              Registrar otro usuario
            </button>
            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="clean-submit-btn"
              >
                Volver a la tienda
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="auth-clean-wrapper" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Cargando sesión...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-clean-wrapper" id="profile-card">
        <div className="auth-clean-header" style={{ marginBottom: '1.5rem' }}>
          <span className="auth-clean-tag" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
            ● Sesión Activa
          </span>
          <h2 className="auth-clean-title">Tu Cuenta</h2>
          <p className="auth-clean-subtitle">Iniciaste sesión correctamente</p>
        </div>

        <div className="auth-profile-box">
          {user.picture ? (
            <img src={user.picture} alt={user.name || 'Usuario'} className="auth-profile-avatar" />
          ) : (
            <div className="auth-profile-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: '2rem' }}>
              👤
            </div>
          )}
          <div>
            <h3 className="auth-profile-name">{user.name}</h3>
            <p className="auth-profile-email">{user.email}</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="clean-submit-btn"
            style={{ background: '#111827' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-clean-wrapper" id="register-form-card">
      <div className="auth-clean-header">
        <h2 className="auth-clean-title">Crear Cuenta</h2>
        <p className="auth-clean-subtitle">
          Completa tus datos para comprar o inicia sesión con Google
        </p>
      </div>

      {errorServidor && (
        <div className="clean-alert clean-alert-error" role="alert" id="auth-server-error">
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}></span>
          <div>
            <strong>Error:</strong> {errorServidor}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-clean-form" id="register-form">
        <div className="auth-clean-field">
          <label htmlFor="reg-nombre" className="auth-clean-label">
            Nombre Completo
          </label>
          <input
            id="reg-nombre"
            type="text"
            className={`auth-clean-input ${erroresCampos.nombre ? 'input-error' : ''}`}
            placeholder="Ej: Juan Pérez"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (erroresCampos.nombre) {
                setErroresCampos((prev) => ({ ...prev, nombre: '' }));
              }
            }}
            disabled={cargando}
            required
          />
          {erroresCampos.nombre && (
            <span className="clean-error-text">{erroresCampos.nombre}</span>
          )}
        </div>

        <div className="auth-clean-field">
          <label htmlFor="reg-email" className="auth-clean-label">
            Correo Electrónico
          </label>
          <input
            id="reg-email"
            type="email"
            className={`auth-clean-input ${erroresCampos.email ? 'input-error' : ''}`}
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (erroresCampos.email) {
                setErroresCampos((prev) => ({ ...prev, email: '' }));
              }
              if (errorServidor) {
                setErrorServidor(null);
              }
            }}
            disabled={cargando}
            required
          />
          {erroresCampos.email && (
            <span className="clean-error-text">{erroresCampos.email}</span>
          )}
        </div>

        <div className="auth-clean-field">
          <label htmlFor="reg-password" className="auth-clean-label">
            Contraseña
          </label>
          <div className="clean-input-wrapper">
            <input
              id="reg-password"
              type={mostrarContrasena ? 'text' : 'password'}
              className={`auth-clean-input ${erroresCampos.contrasena ? 'input-error' : ''}`}
              placeholder="Mínimo 8 caracteres"
              value={contrasena}
              onChange={(e) => {
                setContrasena(e.target.value);
                if (erroresCampos.contrasena) {
                  setErroresCampos((prev) => ({ ...prev, contrasena: '' }));
                }
              }}
              disabled={cargando}
              required
            />
            <button
              type="button"
              className="clean-toggle-pw"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {mostrarContrasena ? '●' : '○'}
            </button>
          </div>
          {erroresCampos.contrasena ? (
            <span className="clean-error-text">{erroresCampos.contrasena}</span>
          ) : (
            <span className="clean-hint-text">Mínimo 8 caracteres.</span>
          )}
        </div>

        <div className="auth-clean-field">
          <label htmlFor="reg-confirm-password" className="auth-clean-label">
            Confirmar Contraseña
          </label>
          <input
            id="reg-confirm-password"
            type={mostrarContrasena ? 'text' : 'password'}
            className={`auth-clean-input ${erroresCampos.confirmarContrasena ? 'input-error' : ''}`}
            placeholder="Repite la contraseña"
            value={confirmarContrasena}
            onChange={(e) => {
              setConfirmarContrasena(e.target.value);
              if (erroresCampos.confirmarContrasena) {
                setErroresCampos((prev) => ({ ...prev, confirmarContrasena: '' }));
              }
            }}
            disabled={cargando}
            required
          />
          {erroresCampos.confirmarContrasena && (
            <span className="clean-error-text">{erroresCampos.confirmarContrasena}</span>
          )}
        </div>

        <button
          type="submit"
          className="clean-submit-btn"
          id="btn-submit-register"
          disabled={cargando}
        >
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>

        <div className="auth-clean-divider">
          <span>o continúa con</span>
        </div>

        <button
          type="button"
          onClick={() => loginWithRedirect()}
          className="auth-google-btn"
          id="btn-login-google"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          Ingresar con Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => loginWithRedirect()}
            style={{
              background: 'none',
              border: 'none',
              color: '#111827',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Iniciar Sesión con Auth0
          </button>
        </div>
      </form>
    </div>

  );
};