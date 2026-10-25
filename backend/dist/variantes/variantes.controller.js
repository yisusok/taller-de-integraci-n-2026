"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantesController = void 0;
const common_1 = require("@nestjs/common");
const variantes_service_1 = require("./variantes.service");
const create_variante_dto_1 = require("./dto/create-variante.dto");
const update_variante_dto_1 = require("./dto/update-variante.dto");
let VariantesController = class VariantesController {
    variantesService;
    constructor(variantesService) {
        this.variantesService = variantesService;
    }
    create(createVarianteDto) {
        return this.variantesService.create(createVarianteDto);
    }
    findAll() {
        return this.variantesService.findAll();
    }
    findOne(id) {
        return this.variantesService.findOne(+id);
    }
    update(id, updateVarianteDto) {
        return this.variantesService.update(+id, updateVarianteDto);
    }
    remove(id) {
        return this.variantesService.remove(+id);
    }
};
exports.VariantesController = VariantesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_variante_dto_1.CreateVarianteDto]),
    __metadata("design:returntype", void 0)
], VariantesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VariantesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VariantesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_variante_dto_1.UpdateVarianteDto]),
    __metadata("design:returntype", void 0)
], VariantesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VariantesController.prototype, "remove", null);
exports.VariantesController = VariantesController = __decorate([
    (0, common_1.Controller)('variantes'),
    __metadata("design:paramtypes", [variantes_service_1.VariantesService])
], VariantesController);
//# sourceMappingURL=variantes.controller.js.map