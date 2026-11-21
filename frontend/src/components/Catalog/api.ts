import { request } from '../Stock/api';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
  productos_count?: number;
}

export interface Variante {
  id: string;
  producto_id: string;
  talle: string;
  color: string;
  material: string | null;
  sku_variante: string;
  activa?: boolean;
  stock_actual: number;
  created_at?: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  marca: string;
  costo?: number;
  precio: number;
  garantia: string | null;
  uso_recomendado: string | null;
  etiquetas: string[];
  imagen_url: string | null;
  activo?: boolean;
  categoria_id: string;
  categoria?: Pick<Categoria, 'id' | 'nombre' | 'descripcion'>;
  variantes: Variante[];
  stock_total: number;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateCategoriaInput {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

export interface UpdateCategoriaInput {
  nombre?: string;
  descripcion?: string;
  activa?: boolean;
}

export interface InitialVarianteInput {
  talle: string;
  color: string;
  material?: string;
  sku_variante?: string;
}

export interface CreateProductoInput {
  sku: string;
  nombre: string;
  descripcion?: string;
  marca: string;
  costo: number;
  precio: number;
  garantia?: string;
  uso_recomendado?: string;
  etiquetas?: string[];
  imagen_url?: string;
  activo?: boolean;
  categoria_id: string;
  variantes?: InitialVarianteInput[];
}

export interface UpdateProductoInput {
  sku?: string;
  nombre?: string;
  descripcion?: string;
  marca?: string;
  costo?: number;
  precio?: number;
  garantia?: string;
  uso_recomendado?: string;
  etiquetas?: string[];
  imagen_url?: string;
  activo?: boolean;
  categoria_id?: string;
}

export interface CreateVarianteInput {
  producto_id: string;
  talle: string;
  color: string;
  material?: string;
  sku_variante?: string;
  activa?: boolean;
}

export interface UpdateVarianteInput {
  talle?: string;
  color?: string;
  material?: string;
  sku_variante?: string;
  activa?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoria_id?: string;
  marca?: string;
  etiqueta?: string;
  limit?: number;
  offset?: number;
}

export interface AdminProductFilters extends ProductFilters {
  activo?: 'true' | 'false';
}

export const CATEGORY_PRESETS = [
  'Urbanas',
  'Casuales',
  'Deportivas',
  'Accesorios',
  'Combos',
];

export const SPORT_TAG_PRESETS = [
  'running',
  'basquet',
  'futbol',
  'training',
  'urbano',
  'casual',
];

export const SHOE_SIZE_PRESETS = ['38', '39', '40', '41', '42', '43', '44', 'U'];

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatArs = (amount: number): string => arsFormatter.format(amount);

export const messageFromError = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const buildProductQuery = (filters: AdminProductFilters): string => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.categoria_id) params.set('categoria_id', filters.categoria_id);
  if (filters.marca?.trim()) params.set('marca', filters.marca.trim());
  if (filters.etiqueta?.trim()) params.set('etiqueta', filters.etiqueta.trim());
  if (filters.activo) params.set('activo', filters.activo);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const catalogApi = {
  listCategories() {
    return request<Categoria[]>('/categorias');
  },

  listAdminCategories() {
    return request<Categoria[]>('/categorias/admin');
  },

  createCategory(input: CreateCategoriaInput) {
    return request<Categoria>('/categorias', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateCategory(id: string, input: UpdateCategoriaInput) {
    return request<Categoria>(`/categorias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  deleteCategory(id: string) {
    return request<void>(`/categorias/${id}`, { method: 'DELETE' });
  },

  listProducts(filters: ProductFilters = {}) {
    return request<PaginatedResult<Producto>>(
      `/productos${buildProductQuery(filters)}`,
    );
  },

  listAdminProducts(filters: AdminProductFilters = {}) {
    return request<PaginatedResult<Producto>>(
      `/productos/admin${buildProductQuery(filters)}`,
    );
  },

  getProduct(id: string) {
    return request<Producto>(`/productos/${id}`);
  },

  createProduct(input: CreateProductoInput) {
    return request<Producto>('/productos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateProduct(id: string, input: UpdateProductoInput) {
    return request<Producto>(`/productos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  deleteProduct(id: string) {
    return request<void>(`/productos/${id}`, { method: 'DELETE' });
  },

  createVariant(input: CreateVarianteInput) {
    return request<Variante>('/variantes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateVariant(id: string, input: UpdateVarianteInput) {
    return request<Variante>(`/variantes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  deleteVariant(id: string) {
    return request<void>(`/variantes/${id}`, { method: 'DELETE' });
  },
};
