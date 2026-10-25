import { Categoria } from '../../categorias/entities/categoria.entity';
import { Variante } from '../../variantes/entities/variante.entity';
export declare class Producto {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    marca: string;
    costo: number;
    precio: number;
    garantia: string;
    activo: boolean;
    categoria: Categoria;
    variantes: Variante[];
}
