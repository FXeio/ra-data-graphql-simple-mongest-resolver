import { GraphQLResolveInfo } from 'graphql';
import { MongoProjection } from 'mongest';
export declare const getProjectionFromGraphQlInfo: (info: GraphQLResolveInfo, virtualFieldDeps: Record<string, string[]>, discriminatorRequiredFields: string[]) => MongoProjection;
