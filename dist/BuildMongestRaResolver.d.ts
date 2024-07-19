import { NestInterceptor, Type } from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { MongestService } from 'mongest';
import { DocOrProjectedDoc } from 'mongest/dist/MongestService';
import { CustomFilter, FilterBuilder } from './CustomFilter';
import { RaPaginationArgs } from './pagination';
import { EntityPayload, ExtractIdType, ItemOrArray, NestGuardClassOrInstance } from './types';
interface ArgsOptions {
    omitFields?: string[];
}
interface ResolverEndpointDefaultOptions {
    guard?: ItemOrArray<NestGuardClassOrInstance>;
    interceptor?: ItemOrArray<NestInterceptor>;
    enable?: boolean;
}
interface VirtualFieldOptions<T> {
    dependsOn?: (string & keyof T)[];
}
export interface MongestRaResolverOptions<T extends EntityPayload, F extends CustomFilter = {}> {
    filter?: {
        classRef: Type<F>;
        filterBuilder: FilterBuilder<T, F>;
    };
    virtualFields?: Record<string, VirtualFieldOptions<T>>;
    discriminatorRequiredExtraFields?: (string & keyof T)[];
    endpoints?: {
        getOne?: ResolverEndpointDefaultOptions & {
            hookPre?: (info: GraphQLResolveInfo, id: ExtractIdType<T>) => Promise<void>;
            hookPost?: (info: GraphQLResolveInfo, id: ExtractIdType<T>, doc: DocOrProjectedDoc<T, any>) => Promise<void | DocOrProjectedDoc<T, any>>;
        };
        getMany?: ResolverEndpointDefaultOptions & {
            hookPre?: (info: GraphQLResolveInfo, args: GetManyArgs<T, F>) => Promise<void>;
            hookPost?: (info: GraphQLResolveInfo, args: GetManyArgs<T, F>, docs: DocOrProjectedDoc<T, any>[]) => Promise<void | DocOrProjectedDoc<T, any>[]>;
        };
        create?: ResolverEndpointDefaultOptions & {
            args?: Type<EntityPayload> | ArgsOptions;
            hookPre?: (doc: Partial<T>) => Promise<void | Partial<T>>;
            hookPost?: (newDoc: T) => Promise<void | T>;
        };
        update?: ResolverEndpointDefaultOptions & {
            args?: Type<{
                id: unknown;
            } & EntityPayload> | ArgsOptions;
            hookPre?: (info: GraphQLResolveInfo, id: ExtractIdType<T>, doc: Partial<T>) => Promise<void>;
            hookPost?: (info: GraphQLResolveInfo, id: ExtractIdType<T>, newDoc: T) => Promise<void | T>;
        };
        delete?: ResolverEndpointDefaultOptions & {
            hookPre?: (id: ExtractIdType<T>) => Promise<void>;
            hookPost?: (oldDoc: T) => Promise<void | T>;
        };
    };
}
export declare type GetManyArgs<T extends EntityPayload, F extends object | undefined = undefined> = RaPaginationArgs<T> & {
    filter?: F;
};
export declare function BuildGetManyArgs<T extends EntityPayload, F extends CustomFilter>(filterOptions: MongestRaResolverOptions<T, F>['filter'] | undefined): Type<GetManyArgs<T, F>>;
export declare function BuildMongestRaResolver<T extends EntityPayload, F extends CustomFilter, Service extends MongestService<T>>(entity: Type<T>, options?: MongestRaResolverOptions<T, F>): Type<T & {
    service: Service;
}>;
export {};
