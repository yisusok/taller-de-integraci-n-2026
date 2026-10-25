import { VariantesService } from './variantes.service';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
export declare class VariantesController {
    private readonly variantesService;
    constructor(variantesService: VariantesService);
    create(createVarianteDto: CreateVarianteDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateVarianteDto: UpdateVarianteDto): string;
    remove(id: string): string;
}
