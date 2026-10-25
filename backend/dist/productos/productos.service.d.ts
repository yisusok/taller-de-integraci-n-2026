import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
export declare class ProductosService {
    create(createProductoDto: CreateProductoDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateProductoDto: UpdateProductoDto): string;
    remove(id: number): string;
}
