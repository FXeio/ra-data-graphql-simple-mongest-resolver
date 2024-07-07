import { NestInterceptor, Type } from '@nestjs/common';
import { MongestService } from 'mongest';
import { CustomFilter, FilterBuilder } from './CustomFilter';
import { RaPaginationArgs } from './pagination';
import { EntityPayload, ItemOrArray, NestGuardClassOrInstance } from './types';
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
        getOne?: ResolverEndpointDefaultOptions;
        getMany?: ResolverEndpointDefaultOptions;
        create?: ResolverEndpointDefaultOptions & {
            args?: Type<EntityPayload> | ArgsOptions;
        };
        update?: ResolverEndpointDefaultOptions & {
            args?: Type<{
                id: unknown;
            } & EntityPayload> | ArgsOptions;
        };
        delete?: ResolverEndpointDefaultOptions;
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
