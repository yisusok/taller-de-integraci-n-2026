import React, { useState, useEffect } from 'react';
import './AdminProductForm.css';

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  costo: number;
  precio: number;
  descripcion?: string;
  garantia?: string;
  etiquetas?: string;
  activo: boolean;
}

export const AdminProductForm = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [costo, setCosto] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [garantia, setGarantia] = useState('');
  const [etiquetas, setEtiquetas] = useState('');
  const [estado, setEstado] = useState('activo');
  const [imagenes, setImagenes] = useState<FileList | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/productos', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setSku('');
    setNombre('');
    setMarca('');
    setCosto('');
    setPrecio('');
    setDescripcion('');
    setGarantia('');
    setEtiquetas('');
    setEstado('activo');
    setImagenes(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagenes(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let response: Response;

      if (editandoId) {
        // Modo Edición (PATCH JSON)
        response = await fetch(
          `http://localhost:3000/api/productos/${editandoId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              sku,
              nombre,
              marca,
              costo: String(costo),
              precio: String(precio),
              descripcion,
              garantia,
              etiquetas,
              estado,
            }),
          },
        );
      } else {
        // Modo Creación (POST FormData con fotos)
        const formData = new FormData();
        formData.append('sku', sku);
        formData.append('nombre', nombre);
        formData.append('marca', marca);
        formData.append('costo', costo);
        formData.append('precio', precio);
        formData.append('descripcion', descripcion);
        formData.append('garantia', garantia);
        formData.append('etiquetas', etiquetas);
        formData.append('estado', estado);

        if (imagenes) {
          for (let i = 0; i < imagenes.length; i++) {
            formData.append('fotos', imagenes[i]);
          }
        }

        response = await fetch('http://localhost:3000/api/productos', {
          method: 'POST',
          body: formData,
          headers: getAuthHeaders(),
        });
      }

      if (response.ok) {
        alert(
          editandoId
            ? '✅ ¡Producto actualizado con éxito!'
            : '✅ ¡Producto guardado en PostgreSQL con éxito!',
        );
        limpiarFormulario();
        cargarProductos();
      } else {
        const errorData = await response.json();
        alert(
          `❌ Error al guardar: ${errorData.message || 'Revisá la consola'}`,
        );
        console.error('Detalle del error:', errorData);
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('🔌 Error de conexión con el backend.');
    }
  };

  const handleEditar = (prod: Producto) => {
    setEditandoId(prod.id);
    setSku(prod.sku);
    setNombre(prod.nombre);
    setMarca(prod.marca);
    setCosto(String(prod.costo));
    setPrecio(String(prod.precio));
    setDescripcion(prod.descripcion || '');
    setGarantia(prod.garantia || '');
    setEtiquetas(prod.etiquetas || '');
    setEstado(prod.activo ? 'activo' : 'pausado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleEstado = async (prod: Producto) => {
    const nuevoEstado = prod.activo ? 'pausado' : 'activo';
    try {
      const response = await fetch(
        `http://localhost:3000/api/productos/${prod.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        },
      );
      if (response.ok) {
        cargarProductos();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleBajaLogica = async (id: string) => {
    if (!window.confirm('¿Seguro que querés dar de baja este producto?')) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/productos/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        cargarProductos();
      }
    } catch (error) {
      console.error('Error al dar de baja:', error);
    }
  };

  return (
    <div className="admin-product-form-container">
      <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>SKU Base:</label>
          <input
            type="text"
            placeholder="Ej: NK-P6000-01"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre del producto:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Marca:</label>
          <input
            type="text"
            placeholder="Ej: Nike"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Costo ($):</label>
          <input
            type="number"
            step="0.01"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Precio de Venta ($):</label>
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Garantía:</label>
          <input
            type="text"
            placeholder="Ej: 6 meses"
            value={garantia}
            onChange={(e) => setGarantia(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Etiquetas (Deporte/Uso):</label>
          <input
            type="text"
            placeholder="Ej: básquet, running"
            value={etiquetas}
            onChange={(e) => setEtiquetas(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Estado del producto:</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
          </select>
        </div>

        {!editandoId && (
          <div className="form-group">
            <label>Fotos del producto:</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagenes && (
              <small>{imagenes.length} imagen(es) seleccionada(s)</small>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="submit-btn">
            {editandoId ? 'Guardar Cambios' : 'Guardar Producto'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={{ padding: '10px 15px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <hr style={{ margin: '30px 0' }} />

      <h3>Catálogo Cargado ({productos.length})</h3>
      {productos.length === 0 ? (
        <p>Todavía no hay productos cargados.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>SKU</th>
              <th style={{ padding: '8px' }}>Nombre</th>
              <th style={{ padding: '8px' }}>Marca</th>
              <th style={{ padding: '8px' }}>Precio</th>
              <th style={{ padding: '8px' }}>Estado</th>
              <th style={{ padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{prod.sku}</td>
                <td style={{ padding: '8px' }}>{prod.nombre}</td>
                <td style={{ padding: '8px' }}>{prod.marca}</td>
                <td style={{ padding: '8px' }}>${prod.precio}</td>
                <td style={{ padding: '8px' }}>
                  {prod.activo ? '🟢 Activo' : '⏸️ Pausado'}
                </td>
                <td style={{ padding: '8px', display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => handleEditar(prod)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleToggleEstado(prod)}>
                    {prod.activo ? 'Pausar' : 'Activar'}
                  </button>
                  {prod.activo && (
                    <button type="button" onClick={() => handleBajaLogica(prod.id)}>
                      Baja
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};