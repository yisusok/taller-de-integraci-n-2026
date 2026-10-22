import React, { useState } from 'react';
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
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const [usuarioRegistrado, setUsuarioRegistrado] = useState<UsuarioCreado | null>(null);

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
            Tu registro ha sido procesado exitosamente y almacenado con cifrado seguro.
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

  return (
    <div className="auth-clean-wrapper" id="register-form-card">
      <div className="auth-clean-header">
        <span className="auth-clean-tag">AUTH-02 &bull; Registro</span>
        <h2 className="auth-clean-title">Crear Cuenta</h2>
        <p className="auth-clean-subtitle">
          Regístrate para comprar y acceder a lanzamientos exclusivos.
        </p>
      </div>

      {errorServidor && (
        <div className="clean-alert clean-alert-error" role="alert" id="auth-server-error">
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
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
              {mostrarContrasena ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
          {erroresCampos.contrasena ? (
            <span className="clean-error-text">{erroresCampos.contrasena}</span>
          ) : (
            <span className="clean-hint-text">Mínimo 8 caracteres (cifrada con bcrypt).</span>
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
      </form>
    </div>
  );
};