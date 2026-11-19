import { Categoria } from '../categorias/entities/categoria.entity';
import { Variante } from '../variantes/entities/variante.entity';
import { Producto } from './entities/producto.entity';

export type VarianteConStock = Variante & { stock_actual: number };

export type VariantePublica = Pick<
  Variante,
  'id' | 'producto_id' | 'talle' | 'color' | 'material' | 'sku_variante'
> & { stock_actual: number };

export type CategoriaPublica = Pick<Categoria, 'id' | 'nombre' | 'descripcion'>;

export type ProductoAdmin = Omit<Producto, 'variantes'> & {
  variantes: VarianteConStock[];
  stock_total: number;
};

export type ProductoPublico = {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  marca: string;
  precio: number;
  garantia: string | null;
  uso_recomendado: string | null;
  etiquetas: string[];
  imagen_url: string | null;
  categoria_id: string;
  categoria?: CategoriaPublica;
  variantes: VariantePublica[];
  stock_total: number;
  created_at: Date;
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export function toPublicVariant(v: VarianteConStock): VariantePublica {
  return {
    id: v.id,
    producto_id: v.producto_id,
    talle: v.talle,
    color: v.color,
    material: v.material,
    sku_variante: v.sku_variante,
    stock_actual: v.stock_actual,
  };
}

export function toPublicProduct(p: ProductoAdmin): ProductoPublico {
  const activeVariants = (p.variantes ?? [])
    .filter((v) => v.activa)
    .map(toPublicVariant);

  return {
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    descripcion: p.descripcion,
    marca: p.marca,
    precio: p.precio,
    garantia: p.garantia,
    uso_recomendado: p.uso_recomendado,
    etiquetas: p.etiquetas,
    imagen_url: p.imagen_url,
    categoria_id: p.categoria_id,
    ...(p.categoria
      ? {
          categoria: {
            id: p.categoria.id,
            nombre: p.categoria.nombre,
            descripcion: p.categoria.descripcion,
          },
        }
      : {}),
    variantes: activeVariants,
    stock_total: activeVariants.reduce((acc, v) => acc + v.stock_actual, 0),
    created_at: p.created_at,
  };
}
