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
Object.defineProperty(exports, "__esModule", { value: true });
exports.raPaginationArgsToPaginationArgs = exports.RaPaginationArgs = exports.ListMetadata = void 0;
const graphql_1 = require("@nestjs/graphql");
let ListMetadata = class ListMetadata {
    constructor(count) {
        this.count = count;
    }
};
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], ListMetadata.prototype, "count", void 0);
ListMetadata = __decorate([
    (0, graphql_1.ObjectType)(),
    __metadata("design:paramtypes", [Number])
], ListMetadata);
exports.ListMetadata = ListMetadata;
let RaPaginationArgs = class RaPaginationArgs {
};
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], RaPaginationArgs.prototype, "page", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], RaPaginationArgs.prototype, "perPage", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], RaPaginationArgs.prototype, "sortField", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], RaPaginationArgs.prototype, "sortOrder", void 0);
RaPaginationArgs = __decorate([
    (0, graphql_1.ArgsType)()
], RaPaginationArgs);
exports.RaPaginationArgs = RaPaginationArgs;
const raSortOrderToMongoSortDirection = (order) => order === 'ASC' ? 1 : -1;
const raPaginationArgsToPaginationArgs = (args) => {
    if (!args) {
        return undefined;
    }
    return Object.assign({ skip: (args.page || 0) * (args.perPage || 1), limit: args.perPage }, (args.sortField
        ? {
            sort: {
                [args.sortField]: args.sortOrder ? raSortOrderToMongoSortDirection(args.sortOrder) : 1,
            },
        }
        : {}));
};
exports.raPaginationArgsToPaginationArgs = raPaginationArgsToPaginationArgs;
//# sourceMappingURL=pagination.js.map