import React, { useCallback, useEffect, useState } from 'react';
import './AddressBook.css';

export interface AddressItem {
  id: string;
  alias: string;
  calle: string;
  numero: string;
  pisoDepto?: string | null;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  esPredeterminada: boolean;
  createdAt?: string;
}

interface AddressBookProps {
  apiBaseUrl?: string;
}

const defaultApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const AddressBook: React.FC<AddressBookProps> = ({
  apiBaseUrl = defaultApiUrl,
}) => {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estado del formulario (crear / editar)
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [alias, setAlias] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [pisoDepto, setPisoDepto] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [esPredeterminada, setEsPredeterminada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchAddresses = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/addresses`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('No se pudieron cargar los domicilios.');
      }
      const data: AddressItem[] = await res.json();
      setAddresses(data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al obtener domicilios.');
    } finally {
      setCargando(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    let ignore = false;
    const loadInitial = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      try {
        const res = await fetch(`${apiBaseUrl}/addresses`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data: AddressItem[] = await res.json();
          if (!ignore) {
            setAddresses(data);
          }
        }
      } catch {
        // Fallback silencioso en montado inicial
      }
    };

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl]);

  const resetForm = () => {
    setEditingId(null);
    setAlias('');
    setCalle('');
    setNumero('');
    setPisoDepto('');
    setCiudad('');
    setProvincia('');
    setCodigoPostal('');
    setEsPredeterminada(addresses.length === 0);
  };

  const openCreateModal = () => {
    if (addresses.length >= 3) {
      setError('Has alcanzado el límite máximo de 3 domicilios.');
      return;
    }
    resetForm();
    setError(null);
    setMensajeExito(null);
    setMostrarModal(true);
  };

  const openEditModal = (addr: AddressItem) => {
    setEditingId(addr.id);
    setAlias(addr.alias);
    setCalle(addr.calle);
    setNumero(addr.numero);
    setPisoDepto(addr.pisoDepto || '');
    setCiudad(addr.ciudad);
    setProvincia(addr.provincia);
    setCodigoPostal(addr.codigoPostal);
    setEsPredeterminada(addr.esPredeterminada);
    setError(null);
    setMensajeExito(null);
    setMostrarModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!alias.trim() || !calle.trim() || !numero.trim() || !ciudad.trim() || !provincia.trim() || !codigoPostal.trim()) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setGuardando(true);

    const payload = {
      alias: alias.trim(),
      calle: calle.trim(),
      numero: numero.trim(),
      pisoDepto: pisoDepto.trim() || undefined,
      ciudad: ciudad.trim(),
      provincia: provincia.trim(),
      codigoPostal: codigoPostal.trim(),
      esPredeterminada,
    };

    try {
      const url = editingId ? `${apiBaseUrl}/addresses/${editingId}` : `${apiBaseUrl}/addresses`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        throw new Error(msg || 'Error al guardar el domicilio.');
      }

      setMensajeExito(editingId ? 'Domicilio actualizado correctamente.' : 'Domicilio registrado exitosamente.');
      setMostrarModal(false);
      resetForm();
      await fetchAddresses();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${apiBaseUrl}/addresses/${id}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Error al establecer dirección predeterminada.');
      }
      setMensajeExito('Dirección predeterminada actualizada.');
      await fetchAddresses();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cambiar dirección predeterminada.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este domicilio de tu libreta?')) {
      return;
    }
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${apiBaseUrl}/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Error al eliminar el domicilio.');
      }
      setMensajeExito('Domicilio eliminado.');
      await fetchAddresses();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="address-book-wrapper">
      <div className="address-book-header">
        <div>
          <h3 className="address-book-title">📦 Libreta de Direcciones de Envío</h3>
          <p className="address-book-subtitle">
            Registra hasta 3 domicilios para agilizar tus compras y envíos.
          </p>
        </div>

        <div className="address-book-actions">
          <span className={`address-counter ${addresses.length >= 3 ? 'limit-reached' : ''}`}>
            {addresses.length} / 3 domicilios
          </span>
          <button
            type="button"
            className="btn-add-address"
            onClick={openCreateModal}
            disabled={addresses.length >= 3}
            title={addresses.length >= 3 ? 'Límite alcanzado' : 'Agregar nuevo domicilio'}
          >
            + Agregar Domicilio
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="clean-alert clean-alert-success" style={{ margin: '1rem 0' }}>
          ✓ {mensajeExito}
        </div>
      )}

      {error && (
        <div className="clean-alert clean-alert-error" style={{ margin: '1rem 0' }}>
          ⚠️ {error}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Cargando domicilios...
        </div>
      ) : addresses.length === 0 ? (
        <div className="empty-address-box">
          <span style={{ fontSize: '2.5rem' }}>🏡</span>
          <p>No tienes ningún domicilio registrado aún.</p>
          <button type="button" className="btn-add-address" onClick={openCreateModal}>
            Registrar mi primer domicilio
          </button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-card ${addr.esPredeterminada ? 'is-default' : ''}`}
            >
              <div className="address-card-top">
                <span className="address-alias">📍 {addr.alias}</span>
                {addr.esPredeterminada ? (
                  <span className="default-badge">⭐ Predeterminada</span>
                ) : (
                  <button
                    type="button"
                    className="btn-set-default"
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    Marcar predeterminada
                  </button>
                )}
              </div>

              <div className="address-details">
                <p className="address-street">
                  {addr.calle} {addr.numero}
                  {addr.pisoDepto ? ` (${addr.pisoDepto})` : ''}
                </p>
                <p className="address-city">
                  {addr.ciudad}, {addr.provincia}
                </p>
                <p className="address-postal">CP: {addr.codigoPostal}</p>
              </div>

              <div className="address-card-footer">
                <button
                  type="button"
                  className="btn-edit-addr"
                  onClick={() => openEditModal(addr)}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="btn-delete-addr"
                  onClick={() => handleDelete(addr.id)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Diálogo de Creación y Edición */}
      {mostrarModal && (
        <div className="address-modal-backdrop">
          <div className="address-modal-content">
            <div className="address-modal-header">
              <h4>{editingId ? 'Editar Domicilio de Envío' : 'Nuevo Domicilio de Envío'}</h4>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setMostrarModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="address-form">
              <div className="auth-clean-field">
                <label className="auth-clean-label">Alias del Domicilio *</label>
                <input
                  type="text"
                  className="auth-clean-input"
                  placeholder="Ej: Casa, Trabajo, Casa de Padres"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Calle *</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="Av. Santa Fe"
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Altura / Nro *</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="1234"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Piso / Depto (Opcional)</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="4to B"
                    value={pisoDepto}
                    onChange={(e) => setPisoDepto(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Código Postal *</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="1425"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Ciudad *</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="CABA, Rosario, etc."
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="auth-clean-field">
                  <label className="auth-clean-label">Provincia *</label>
                  <input
                    type="text"
                    className="auth-clean-input"
                    placeholder="Buenos Aires, Santa Fe, etc."
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chk-default-addr"
                  checked={esPredeterminada}
                  onChange={(e) => setEsPredeterminada(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="chk-default-addr"
                  style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                >
                  Establecer como dirección de envío predeterminada
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="variant-btn"
                  onClick={() => setMostrarModal(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clean-submit-btn"
                  style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Domicilio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
