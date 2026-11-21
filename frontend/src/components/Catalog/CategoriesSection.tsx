import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminPageHeading } from '../AdminLayout/AdminLayout';
import { CATEGORY_PRESETS, catalogApi, messageFromError } from './api';
import type { Categoria } from './api';
import './Catalog.css';

export function CategoriesSection() {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activa, setActiva] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const items = await catalogApi.listAdminCategories();
      setCategories(items);
    } catch (err) {
      setListError(messageFromError(err, 'No se pudieron cargar las categorías.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    catalogApi
      .listAdminCategories()
      .then((items) => {
        if (!ignore) {
          setCategories(items);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setListError(messageFromError(err, 'No se pudieron cargar las categorías.'));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setActiva(true);
    setFormError(null);
  };

  const startEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion ?? '');
    setActiva(cat.activa);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanName = nombre.trim();
    if (cleanName.length < 2) {
      setFormError('El nombre de la categoría es obligatorio (mínimo 2 caracteres).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await catalogApi.updateCategory(editingId, {
          nombre: cleanName,
          descripcion: descripcion.trim(),
          activa,
        });
        setFormSuccess(`Categoría "${cleanName}" actualizada.`);
      } else {
        await catalogApi.createCategory({
          nombre: cleanName,
          descripcion: descripcion.trim() || undefined,
          activa,
        });
        setFormSuccess(`Categoría "${cleanName}" creada correctamente.`);
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setFormError(messageFromError(err, 'No se pudo guardar la categoría.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Categoria) => {
    setBusyRowId(cat.id);
    setListError(null);
    try {
      await catalogApi.updateCategory(cat.id, { activa: !cat.activa });
      await loadCategories();
    } catch (err) {
      setListError(messageFromError(err, 'No se pudo actualizar el estado.'));
    } finally {
      setBusyRowId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyRowId(id);
    setListError(null);
    try {
      await catalogApi.deleteCategory(id);
      setConfirmDeleteId(null);
      if (editingId === id) {
        resetForm();
      }
      await loadCategories();
    } catch (err) {
      setListError(messageFromError(err, 'No se pudo eliminar la categoría.'));
      setConfirmDeleteId(null);
    } finally {
      setBusyRowId(null);
    }
  };

  return (
    <>
      <AdminPageHeading
        eyebrow="Administración / Catálogo"
        title="Categorías"
        subtitle="Organizá el catálogo de Sneackers en urbanas, casuales, deportivas, accesorios y combos."
      />

      <div className="admin-grid">
        <form className="admin-panel" onSubmit={handleSubmit} noValidate>
          <div>
            <h2 className="admin-panel__title">
              {editingId ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <p className="admin-panel__helper">
              Definí las líneas principales para segmentar productos y filtros en la tienda.
            </p>
          </div>

          <div className="admin-field">
            <label htmlFor="cat-nombre" className="admin-field__label">
              Nombre
            </label>
            <input
              id="cat-nombre"
              className="admin-input"
              type="text"
              maxLength={50}
              placeholder="Ej. Deportivas"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
            {!editingId && (
              <div className="admin-chips">
                {CATEGORY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="admin-chip"
                    onClick={() => setNombre(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="cat-descripcion" className="admin-field__label">
              Descripción (opcional)
            </label>
            <textarea
              id="cat-descripcion"
              className="admin-textarea"
              maxLength={500}
              placeholder="Ej. Calzado técnico para running, básquet y entrenamiento."
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>

          <label className="catalog-checkbox">
            <input
              type="checkbox"
              checked={activa}
              onChange={(event) => setActiva(event.target.checked)}
            />
            <span>Visible en el catálogo público (activa)</span>
          </label>

          {formError && (
            <div className="admin-alert admin-alert--error" role="alert">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="admin-alert admin-alert--success" role="status">
              {formSuccess}
            </div>
          )}

          <div className="admin-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting
                ? 'Guardando…'
                : editingId
                  ? 'Guardar cambios'
                  : 'Crear categoría'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => {
                resetForm();
                setFormSuccess(null);
              }}
            >
              {editingId ? 'Cancelar edición' : 'Limpiar'}
            </button>
          </div>
        </form>

        <section className="admin-panel" aria-labelledby="cat-list-title">
          <div className="admin-panel__header">
            <div>
              <h2 id="cat-list-title" className="admin-panel__title">
                Categorías registradas ({categories.length})
              </h2>
              <p className="admin-panel__helper">
                Las categorías con productos asociados no pueden eliminarse; podés desactivarlas.
              </p>
            </div>
            <button
              type="button"
              className="admin-link"
              onClick={() => void loadCategories()}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : '↻ Actualizar'}
            </button>
          </div>

          {listError && (
            <div className="admin-alert admin-alert--error" role="alert">
              {listError}
            </div>
          )}

          {loading && categories.length === 0 ? (
            <p className="admin-empty">Cargando categorías…</p>
          ) : categories.length === 0 ? (
            <p className="admin-empty">
              Todavía no creaste ninguna categoría. Usá el formulario de la izquierda o los accesos rápidos.
            </p>
          ) : (
            <div className="catalog-list">
              {categories.map((cat) => {
                const isBusy = busyRowId === cat.id;
                const confirming = confirmDeleteId === cat.id;

                return (
                  <article key={cat.id} className="catalog-row">
                    <div className="catalog-row__main">
                      <div className="catalog-row__title-line">
                        <strong className="catalog-row__name">{cat.nombre}</strong>
                        <span className={`admin-pill ${cat.activa ? 'admin-pill--ok' : 'admin-pill--bad'}`}>
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className="admin-pill admin-pill--neutral">
                          {cat.productos_count ?? 0} producto(s)
                        </span>
                      </div>
                      {cat.descripcion && (
                        <p className="catalog-row__desc">{cat.descripcion}</p>
                      )}
                    </div>

                    <div className="catalog-row__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => startEdit(cat)}
                        disabled={isBusy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary catalog-btn-sm"
                        onClick={() => void handleToggleActive(cat)}
                        disabled={isBusy}
                      >
                        {cat.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      {confirming ? (
                        <div className="catalog-confirm-inline">
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary catalog-btn-sm"
                            onClick={() => void handleDelete(cat.id)}
                            disabled={isBusy}
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary catalog-btn-sm"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isBusy}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary catalog-btn-sm"
                          onClick={() => setConfirmDeleteId(cat.id)}
                          disabled={isBusy}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
