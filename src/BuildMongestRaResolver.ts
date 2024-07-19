/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import {
  NestInterceptor,
  NotFoundException,
  Type,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  Args,
  ArgsType,
  Field,
  ID,
  Info,
  Mutation,
  OmitType,
  Parent,
  PartialType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { mapValues } from 'lodash';
import { MongestService } from 'mongest';
import { DocOrProjectedDoc } from 'mongest/dist/MongestService';
import { FindManyDocsPaginationArgs } from 'mongest/dist/pagination';
import { FilterQuery } from 'mongoose';
import pluralize from 'pluralize';
import { CustomFilter, FilterBuilder } from './CustomFilter';
import { DecorateIf, NoopDecorator } from './decorators';
import { getProjectionFromGraphQlInfo } from './getProjectionFromGraphQlInfo';
import { ListMetadata, RaPaginationArgs, raPaginationArgsToPaginationArgs } from './pagination';
import { EntityPayload, ExtractIdType, ItemOrArray, NestGuardClassOrInstance } from './types';

interface ArgsOptions {
  // Omit field from the ArgsType payload.
  omitFields?: string[];
}

interface ResolverEndpointDefaultOptions {
  // If this endpoint must be guarded (e.g. for authorization)
  guard?: ItemOrArray<NestGuardClassOrInstance>;
  // If this endpoint must be intercepted
  interceptor?: ItemOrArray<NestInterceptor>;
  // Set to `false` to disable the endpoint.
  enable?: boolean;
}

interface VirtualFieldOptions<T> {
  // Fields required to resolve the given virtual field, e.g. `_id` is usually needed to resolve `id`.
  // Mongest will make sure they are included in the mongo projection.
  dependsOn?: (string & keyof T)[];
}

export interface MongestRaResolverOptions<T extends EntityPayload, F extends CustomFilter = {}> {
  // Provide a filter in the graphql query endpoints
  filter?: {
    // Filter InputType class
    classRef: Type<F>;

    // Function converting your Filter to a mongo filter
    filterBuilder: FilterBuilder<T, F>;
  };

  // Virtual fields options e.g. @ResolveField(() => String)
  virtualFields?: Record<string, VirtualFieldOptions<T>>;

  // Extra fields required for your graphql's resolveType().
  // They will always be included in the mongo projection.
  // Note: mongoose's discriminator is already implicitly added, you dont need to add it here.
  discriminatorRequiredExtraFields?: (string & keyof T)[];

  // Endpoint options.
  endpoints?: {
    getOne?: ResolverEndpointDefaultOptions & {
      hookPre?: (info: GraphQLResolveInfo, id: ExtractIdType<T>) => Promise<void>;
      hookPost?: (
        info: GraphQLResolveInfo,
        id: ExtractIdType<T>,
        doc: DocOrProjectedDoc<T, any>,
      ) => Promise<void | DocOrProjectedDoc<T, any>>;
    };
    getMany?: ResolverEndpointDefaultOptions & {
      hookPre?: (info: GraphQLResolveInfo, args: GetManyArgs<T, F>) => Promise<void>;
      hookPost?: (
        info: GraphQLResolveInfo,
        args: GetManyArgs<T, F>,
        docs: DocOrProjectedDoc<T, any>[],
      ) => Promise<void | DocOrProjectedDoc<T, any>[]>;
    };
    create?: ResolverEndpointDefaultOptions & {
      args?:
        | Type<EntityPayload> // Provide your own ArgsType graphql class
        | ArgsOptions; // or let mongest generate it from your entity.
      hookPre?: (doc: Partial<T>) => Promise<void | Partial<T>>;
      hookPost?: (newDoc: T) => Promise<void | T>;
    };
    update?: ResolverEndpointDefaultOptions & {
      args?:
        | Type<{ id: unknown } & EntityPayload> // Provide your own ArgsType graphql class
        | ArgsOptions; // or let mongest generate it from your entity.
      hookPre?: (info: GraphQLResolveInfo, id: ExtractIdType<T>, doc: Partial<T>) => Promise<void>;
      hookPost?: (info: GraphQLResolveInfo, id: ExtractIdType<T>, newDoc: T) => Promise<void | T>;
    };
    delete?: ResolverEndpointDefaultOptions & {
      hookPre?: (id: ExtractIdType<T>) => Promise<void>;
      hookPost?: (oldDoc: T) => Promise<void | T>;
    };
  };
}

export type GetManyArgs<
  T extends EntityPayload,
  F extends object | undefined = undefined,
> = RaPaginationArgs<T> & { filter?: F };

export function BuildGetManyArgs<T extends EntityPayload, F extends CustomFilter>(
  filterOptions: MongestRaResolverOptions<T, F>['filter'] | undefined,
): Type<GetManyArgs<T, F>> {
  const FilterClassRef = filterOptions?.classRef;

  if (FilterClassRef) {
    @ArgsType()
    abstract class FindManyArgsHost extends RaPaginationArgs<T> {
      @Field(() => FilterClassRef, {
        nullable: true,
      })
      filter?: F;
    }
    return FindManyArgsHost as any;
  } else {
    @ArgsType()
    abstract class FindManyArgsHost extends RaPaginationArgs<T> {}
    return FindManyArgsHost as any;
  }
}

function GuardFromOptions(
  guard: ItemOrArray<NestGuardClassOrInstance> | undefined,
): MethodDecorator {
  return Array.isArray(guard) ? UseGuards(...guard) : guard ? UseGuards(guard) : NoopDecorator;
}

function InterceptorFromOptions(
  interceptor: ItemOrArray<NestInterceptor> | undefined,
): MethodDecorator {
  return Array.isArray(interceptor)
    ? UseInterceptors(...interceptor)
    : interceptor
    ? UseInterceptors(interceptor)
    : NoopDecorator;
}

export function BuildMongestRaResolver<
  T extends EntityPayload,
  F extends CustomFilter,
  Service extends MongestService<T>,
>(entity: Type<T>, options: MongestRaResolverOptions<T, F> = {}): Type<T & { service: Service }> {
  type IdType = ExtractIdType<T>;

  const filterBuilder = options.filter?.filterBuilder;
  const entityClassRef = entity;
  const graphqlEntityName =
    TypeMetadataStorage.getObjectTypeMetadataByTarget(entityClassRef)?.name || entityClassRef.name;
  const nameSingularForm = graphqlEntityName;
  const namePluralForm = pluralize(graphqlEntityName);
  const virtualFieldOptions: Record<string, VirtualFieldOptions<T>> = {
    ...options?.virtualFields,
    // This resolver has a builting ResolveField for id, but it could be overriden.
    id: (options?.virtualFields?.id || { dependsOn: ['_id'] }) as VirtualFieldOptions<T>,
  };
  const virtualFieldDeps = mapValues(virtualFieldOptions, (val) => val.dependsOn || []);
  const discriminatorRequiredFields = options.discriminatorRequiredExtraFields || [];

  @ArgsType()
  abstract class GetManyArgs extends BuildGetManyArgs<T, F>(options.filter) {}

  const endpointOptions = options.endpoints || {};

  const DefaultCreateArgs = PartialType(
    OmitType<any, any>(
      entityClassRef,
      (typeof endpointOptions.create?.args === 'object' &&
        endpointOptions.create.args.omitFields) || ['id'],
    ),
    ArgsType,
  );

  const CreateArgsClass =
    typeof endpointOptions.create?.args === 'function'
      ? endpointOptions.create.args
      : DefaultCreateArgs;

  const DefaultUpdateDocArgs = PartialType(
    OmitType<any, any>(
      entityClassRef,
      (typeof endpointOptions.update?.args === 'object' &&
        endpointOptions.update.args.omitFields && [
          ...endpointOptions.update.args.omitFields,
          'id',
        ]) || ['id'],
    ),
    ArgsType,
  );

  const UpdateArgs =
    typeof endpointOptions.update?.args === 'function'
      ? endpointOptions.update.args
      : DefaultUpdateDocArgs;

  const raFilterToMongoFilter = async (filter?: F): Promise<FilterQuery<T>> => {
    if (filterBuilder && filter) {
      return await filterBuilder(filter);
    } else {
      return {};
    }
  };

  const GetManyArgsToFindManyOptions = async (
    getManyArgs?: GetManyArgs,
  ): Promise<FindManyDocsPaginationArgs<T> | undefined> => {
    if (!getManyArgs) {
      return undefined;
    }
    return raPaginationArgsToPaginationArgs<T>(getManyArgs);
  };

  @Resolver(() => entityClassRef, { isAbstract: true })
  abstract class BaseResolverHost {
    constructor(protected service: Service) {}

    @DecorateIf(
      endpointOptions.getOne?.enable ?? true,
      Query(() => entityClassRef, {
        name: nameSingularForm,
      }),
    )
    @GuardFromOptions(endpointOptions.getOne?.guard)
    @InterceptorFromOptions(endpointOptions.getOne?.interceptor)
    async getOne(
      @Info() info: GraphQLResolveInfo,
      @Args('id', { type: () => ID }) id: IdType,
    ): Promise<DocOrProjectedDoc<T, any>> {
      await endpointOptions.getOne?.hookPre?.(info, id);
      const projection = getProjectionFromGraphQlInfo(
        info,
        virtualFieldDeps,
        discriminatorRequiredFields,
      );
      const doc = await this.service.findById(id, { projection });
      if (!doc) {
        throw new NotFoundException();
      }
      return (
        (await endpointOptions.getOne?.hookPost?.(info, id, doc)) ||
        (doc as DocOrProjectedDoc<T, any>)
      );
    }

    @DecorateIf(
      endpointOptions.getMany?.enable ?? true,
      Query(() => [entityClassRef], {
        name: `all${namePluralForm}`,
      }),
    )
    @GuardFromOptions(endpointOptions.getMany?.guard)
    @InterceptorFromOptions(endpointOptions.getMany?.interceptor)
    async getMany(
      @Info() info: GraphQLResolveInfo,
      @Args({ type: () => GetManyArgs }) args?: any,
    ): Promise<DocOrProjectedDoc<T, any>[]> {
      // console.log('info', JSON.stringify(info.fieldNodes[0]?.selectionSet, null, 2));
      await endpointOptions.getMany?.hookPre?.(info, args);
      const projection = getProjectionFromGraphQlInfo(
        info,
        virtualFieldDeps,
        discriminatorRequiredFields,
      );
      const mongoFilter = await raFilterToMongoFilter(args?.filter);
      const queryOptions = {
        ...(await GetManyArgsToFindManyOptions(args)),
        projection,
      };
      // console.log('queryOptions', queryOptions);
      // console.log('projection', projection);
      // console.log('projection', projection);
      const docs = await this.service.find(mongoFilter, queryOptions);
      // console.log('docs', docs);
      return (
        (await endpointOptions.getMany?.hookPost?.(info, args, docs)) ||
        (docs as DocOrProjectedDoc<T, any>[])
      );
    }

    @DecorateIf(
      endpointOptions.getMany?.enable ?? true,
      Query(() => ListMetadata, {
        name: `_all${namePluralForm}Meta`,
      }),
    )
    @GuardFromOptions(endpointOptions.getMany?.guard)
    @InterceptorFromOptions(endpointOptions.getMany?.interceptor)
    async getManyMeta(@Args({ type: () => GetManyArgs }) args?: any): Promise<ListMetadata> {
      const mongoFilter = await raFilterToMongoFilter(args?.filter);
      const count = await this.service.countDocuments(mongoFilter);
      return new ListMetadata(count);
    }

    @DecorateIf(
      endpointOptions.create?.enable ?? false,
      Mutation(() => entityClassRef, {
        name: `create${nameSingularForm}`,
      }),
    )
    @GuardFromOptions(endpointOptions.create?.guard)
    @InterceptorFromOptions(endpointOptions.create?.interceptor)
    async create(@Args({ type: () => CreateArgsClass }) doc: Partial<T>): Promise<T> {
      const newDoc = await this.service.insert(
        (await endpointOptions.create?.hookPre?.(doc)) || doc,
      );
      return (await endpointOptions.create?.hookPost?.(newDoc)) || newDoc;
    }

    @DecorateIf(
      endpointOptions.update?.enable ?? false,
      Mutation(() => entityClassRef, {
        name: `update${nameSingularForm}`,
      }),
    )
    @GuardFromOptions(endpointOptions.update?.guard)
    @InterceptorFromOptions(endpointOptions.update?.interceptor)
    async update(
      @Info() info: GraphQLResolveInfo,
      @Args('id', { type: () => ID }) id: IdType,
      @Args({ type: () => UpdateArgs }) doc: Partial<T>,
    ): Promise<T> {
      if (!id) {
        throw Error(`field 'id' missing in update's args: ${JSON.stringify(doc)}`);
      }
      await endpointOptions.update?.hookPre?.(info, id, doc);
      const projection = getProjectionFromGraphQlInfo(
        info,
        virtualFieldDeps,
        discriminatorRequiredFields,
      );
      const newDoc = await this.service.findByIdAndUpdate(id, doc, { new: true, projection });
      if (!newDoc) {
        throw new NotFoundException(`Doc ${nameSingularForm} with id ${id} not found`);
      }
      return (await endpointOptions.update?.hookPost?.(info, id, newDoc as T)) || (newDoc as T);
    }

    @DecorateIf(
      endpointOptions.delete?.enable ?? false,
      Mutation(() => entityClassRef, {
        name: `delete${nameSingularForm}`,
      }),
    )
    @GuardFromOptions(endpointOptions.delete?.guard)
    @InterceptorFromOptions(endpointOptions.delete?.interceptor)
    async delete(@Args('id', { type: () => ID }) id: IdType): Promise<T> {
      await endpointOptions.delete?.hookPre?.(id);
      const oldDoc = await this.service.findByIdAndDelete(id);
      if (!oldDoc) {
        throw new NotFoundException(`Doc ${nameSingularForm} with id ${String(id)} not found`);
      }
      return (await endpointOptions.delete?.hookPost?.(oldDoc)) || oldDoc;
    }

    @ResolveField(() => ID)
    async id(@Parent() parent: { _id: any }) {
      return parent._id;
    }
  }
  return BaseResolverHost as any;
}
