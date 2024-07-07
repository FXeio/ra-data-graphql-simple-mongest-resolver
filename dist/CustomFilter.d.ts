import { FilterQuery } from 'mongoose';
export declare type CustomFilter = object;
export declare type FilterBuilder<T, F extends CustomFilter> = (filter: F) => FilterQuery<T> | Promise<FilterQuery<T>>;
