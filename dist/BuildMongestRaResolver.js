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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildMongestRaResolver = exports.BuildGetManyArgs = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const lodash_1 = require("lodash");
const pluralize_1 = __importDefault(require("pluralize"));
const decorators_1 = require("./decorators");
const getProjectionFromGraphQlInfo_1 = require("./getProjectionFromGraphQlInfo");
const pagination_1 = require("./pagination");
function BuildGetManyArgs(filterOptions) {
    const FilterClassRef = filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.classRef;
    if (FilterClassRef) {
        let FindManyArgsHost = class FindManyArgsHost extends pagination_1.RaPaginationArgs {
        };
        __decorate([
            (0, graphql_1.Field)(() => FilterClassRef, {
                nullable: true,
            }),
            __metadata("design:type", Object)
        ], FindManyArgsHost.prototype, "filter", void 0);
        FindManyArgsHost = __decorate([
            (0, graphql_1.ArgsType)()
        ], FindManyArgsHost);
        return FindManyArgsHost;
    }
    else {
        let FindManyArgsHost = class FindManyArgsHost extends pagination_1.RaPaginationArgs {
        };
        FindManyArgsHost = __decorate([
            (0, graphql_1.ArgsType)()
        ], FindManyArgsHost);
        return FindManyArgsHost;
    }
}
exports.BuildGetManyArgs = BuildGetManyArgs;
function GuardFromOptions(guard) {
    return Array.isArray(guard) ? (0, common_1.UseGuards)(...guard) : guard ? (0, common_1.UseGuards)(guard) : decorators_1.NoopDecorator;
}
function InterceptorFromOptions(interceptor) {
    return Array.isArray(interceptor)
        ? (0, common_1.UseInterceptors)(...interceptor)
        : interceptor
            ? (0, common_1.UseInterceptors)(interceptor)
            : decorators_1.NoopDecorator;
}
function BuildMongestRaResolver(entity, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
    const filterBuilder = (_a = options.filter) === null || _a === void 0 ? void 0 : _a.filterBuilder;
    const entityClassRef = entity;
    const graphqlEntityName = ((_b = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(entityClassRef)) === null || _b === void 0 ? void 0 : _b.name) || entityClassRef.name;
    const nameSingularForm = graphqlEntityName;
    const namePluralForm = (0, pluralize_1.default)(graphqlEntityName);
    const virtualFieldOptions = Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.virtualFields), { id: (((_c = options === null || options === void 0 ? void 0 : options.virtualFields) === null || _c === void 0 ? void 0 : _c.id) || { dependsOn: ['_id'] }) });
    const virtualFieldDeps = (0, lodash_1.mapValues)(virtualFieldOptions, (val) => val.dependsOn || []);
    const discriminatorRequiredFields = options.discriminatorRequiredExtraFields || [];
    let GetManyArgs = class GetManyArgs extends BuildGetManyArgs(options.filter) {
    };
    GetManyArgs = __decorate([
        (0, graphql_1.ArgsType)()
    ], GetManyArgs);
    const endpointOptions = options.endpoints || {};
    const DefaultCreateArgs = (0, graphql_1.PartialType)((0, graphql_1.OmitType)(entityClassRef, (typeof ((_d = endpointOptions.create) === null || _d === void 0 ? void 0 : _d.args) === 'object' &&
        endpointOptions.create.args.omitFields) || ['id']), graphql_1.ArgsType);
    const CreateArgsClass = typeof ((_e = endpointOptions.create) === null || _e === void 0 ? void 0 : _e.args) === 'function'
        ? endpointOptions.create.args
        : DefaultCreateArgs;
    const DefaultUpdateDocArgs = (0, graphql_1.PartialType)((0, graphql_1.OmitType)(entityClassRef, (typeof ((_f = endpointOptions.update) === null || _f === void 0 ? void 0 : _f.args) === 'object' &&
        endpointOptions.update.args.omitFields && [
        ...endpointOptions.update.args.omitFields,
        'id',
    ]) || ['id']), graphql_1.ArgsType);
    const UpdateArgs = typeof ((_g = endpointOptions.update) === null || _g === void 0 ? void 0 : _g.args) === 'function'
        ? endpointOptions.update.args
        : DefaultUpdateDocArgs;
    const raFilterToMongoFilter = async (filter) => {
        if (filterBuilder && filter) {
            return await filterBuilder(filter);
        }
        else {
            return {};
        }
    };
    const GetManyArgsToFindManyOptions = async (getManyArgs) => {
        if (!getManyArgs) {
            return undefined;
        }
        return (0, pagination_1.raPaginationArgsToPaginationArgs)(getManyArgs);
    };
    let BaseResolverHost = class BaseResolverHost {
        constructor(service) {
            this.service = service;
        }
        async getOne(info, id) {
            const projection = (0, getProjectionFromGraphQlInfo_1.getProjectionFromGraphQlInfo)(info, virtualFieldDeps, discriminatorRequiredFields);
            const doc = await this.service.findById(id, { projection });
            if (!doc) {
                throw new common_1.NotFoundException();
            }
            return doc;
        }
        async getMany(info, args) {
            const projection = (0, getProjectionFromGraphQlInfo_1.getProjectionFromGraphQlInfo)(info, virtualFieldDeps, discriminatorRequiredFields);
            const mongoFilter = await raFilterToMongoFilter(args === null || args === void 0 ? void 0 : args.filter);
            const queryOptions = Object.assign(Object.assign({}, (await GetManyArgsToFindManyOptions(args))), { projection });
            const docs = await this.service.find(mongoFilter, queryOptions);
            return docs;
        }
        async getManyMeta(args) {
            const mongoFilter = await raFilterToMongoFilter(args === null || args === void 0 ? void 0 : args.filter);
            const count = await this.service.countDocuments(mongoFilter);
            return new pagination_1.ListMetadata(count);
        }
        async create(doc) {
            return await this.service.insert(doc);
        }
        async update(info, id, doc) {
            if (!id) {
                throw Error(`field 'id' missing in update's args: ${JSON.stringify(doc)}`);
            }
            const projection = (0, getProjectionFromGraphQlInfo_1.getProjectionFromGraphQlInfo)(info, virtualFieldDeps, discriminatorRequiredFields);
            const newDoc = await this.service.findByIdAndUpdate(id, doc, { new: true, projection });
            if (!newDoc) {
                throw new common_1.NotFoundException(`Doc ${nameSingularForm} with id ${id} not found`);
            }
            return newDoc;
        }
        async delete(id) {
            const oldDoc = await this.service.findByIdAndDelete(id);
            if (!oldDoc) {
                throw new common_1.NotFoundException(`Doc ${nameSingularForm} with id ${String(id)} not found`);
            }
            return oldDoc;
        }
        async id(parent) {
            return parent._id;
        }
    };
    __decorate([
        (0, decorators_1.DecorateIf)((_j = (_h = endpointOptions.getOne) === null || _h === void 0 ? void 0 : _h.enable) !== null && _j !== void 0 ? _j : true, (0, graphql_1.Query)(() => entityClassRef, {
            name: nameSingularForm,
        })),
        GuardFromOptions((_k = endpointOptions.getOne) === null || _k === void 0 ? void 0 : _k.guard),
        InterceptorFromOptions((_l = endpointOptions.getOne) === null || _l === void 0 ? void 0 : _l.interceptor),
        __param(0, (0, graphql_1.Info)()),
        __param(1, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "getOne", null);
    __decorate([
        (0, decorators_1.DecorateIf)((_o = (_m = endpointOptions.getMany) === null || _m === void 0 ? void 0 : _m.enable) !== null && _o !== void 0 ? _o : true, (0, graphql_1.Query)(() => [entityClassRef], {
            name: `all${namePluralForm}`,
        })),
        GuardFromOptions((_p = endpointOptions.getMany) === null || _p === void 0 ? void 0 : _p.guard),
        InterceptorFromOptions((_q = endpointOptions.getMany) === null || _q === void 0 ? void 0 : _q.interceptor),
        __param(0, (0, graphql_1.Info)()),
        __param(1, (0, graphql_1.Args)({ type: () => GetManyArgs })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "getMany", null);
    __decorate([
        (0, decorators_1.DecorateIf)((_s = (_r = endpointOptions.getMany) === null || _r === void 0 ? void 0 : _r.enable) !== null && _s !== void 0 ? _s : true, (0, graphql_1.Query)(() => pagination_1.ListMetadata, {
            name: `_all${namePluralForm}Meta`,
        })),
        GuardFromOptions((_t = endpointOptions.getMany) === null || _t === void 0 ? void 0 : _t.guard),
        InterceptorFromOptions((_u = endpointOptions.getMany) === null || _u === void 0 ? void 0 : _u.interceptor),
        __param(0, (0, graphql_1.Args)({ type: () => GetManyArgs })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "getManyMeta", null);
    __decorate([
        (0, decorators_1.DecorateIf)((_w = (_v = endpointOptions.create) === null || _v === void 0 ? void 0 : _v.enable) !== null && _w !== void 0 ? _w : false, (0, graphql_1.Mutation)(() => entityClassRef, {
            name: `create${nameSingularForm}`,
        })),
        GuardFromOptions((_x = endpointOptions.create) === null || _x === void 0 ? void 0 : _x.guard),
        InterceptorFromOptions((_y = endpointOptions.create) === null || _y === void 0 ? void 0 : _y.interceptor),
        __param(0, (0, graphql_1.Args)({ type: () => CreateArgsClass })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "create", null);
    __decorate([
        (0, decorators_1.DecorateIf)((_0 = (_z = endpointOptions.update) === null || _z === void 0 ? void 0 : _z.enable) !== null && _0 !== void 0 ? _0 : false, (0, graphql_1.Mutation)(() => entityClassRef, {
            name: `update${nameSingularForm}`,
        })),
        GuardFromOptions((_1 = endpointOptions.update) === null || _1 === void 0 ? void 0 : _1.guard),
        InterceptorFromOptions((_2 = endpointOptions.update) === null || _2 === void 0 ? void 0 : _2.interceptor),
        __param(0, (0, graphql_1.Info)()),
        __param(1, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
        __param(2, (0, graphql_1.Args)({ type: () => UpdateArgs })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "update", null);
    __decorate([
        (0, decorators_1.DecorateIf)((_4 = (_3 = endpointOptions.delete) === null || _3 === void 0 ? void 0 : _3.enable) !== null && _4 !== void 0 ? _4 : false, (0, graphql_1.Mutation)(() => entityClassRef, {
            name: `delete${nameSingularForm}`,
        })),
        GuardFromOptions((_5 = endpointOptions.delete) === null || _5 === void 0 ? void 0 : _5.guard),
        InterceptorFromOptions((_6 = endpointOptions.delete) === null || _6 === void 0 ? void 0 : _6.interceptor),
        __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "delete", null);
    __decorate([
        (0, graphql_1.ResolveField)(() => graphql_1.ID),
        __param(0, (0, graphql_1.Parent)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolverHost.prototype, "id", null);
    BaseResolverHost = __decorate([
        (0, graphql_1.Resolver)(() => entityClassRef, { isAbstract: true }),
        __metadata("design:paramtypes", [Object])
    ], BaseResolverHost);
    return BaseResolverHost;
}
exports.BuildMongestRaResolver = BuildMongestRaResolver;
//# sourceMappingURL=BuildMongestRaResolver.js.map