import { FindManyDocsPaginationArgs } from 'mongest/dist/pagination';
export declare class ListMetadata {
    count: number;
    constructor(count: number);
}
export declare type RaSortOrder = 'ASC' | 'DESC';
export interface IRaPaginationArgs<T> {
    page?: number;
    perPage?: number;
    sortField?: keyof T;
    sortOrder?: RaSortOrder;
}
export declare class RaPaginationArgs<T> implements IRaPaginationArgs<T> {
    page?: number;
    perPage?: number;
    sortField?: keyof T;
    sortOrder?: RaSortOrder;
}
export declare const raPaginationArgsToPaginationArgs: <T extends object>(args?: IRaPaginationArgs<T> | undefined) => FindManyDocsPaginationArgs<T> | undefined;
