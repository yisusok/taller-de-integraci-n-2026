import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
export declare class VariantesService {
    create(createVarianteDto: CreateVarianteDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateVarianteDto: UpdateVarianteDto): string;
    remove(id: number): string;
}
