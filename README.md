# Mongest Resolver for ra-data-graphql-simple (BETA)

### Automatic ReactAdmin GraphQL resolver

This is a BETA, and therefore you may encounter bugs. Please [post an issue](https://github.com/OoDeLally/ra-data-graphql-simple-mongest-resolver/issues) if needed.

## TL;DR

* Out-of-the-box GraphQL NestJS resolver CRUD endpoints for [ra-data-graphql-simple](https://github.com/marmelab/react-admin/tree/master/packages/ra-data-graphql-simple).
* Optimized: Uses mongo projections to only fetch the fields asked by the GraphQL query, no less, no more.
* Fully customizable, overridable and expandable NestJS resolver.

## Demo

A cat-based demo of both backend and react-admin client is available.
Clone this repo on your machine and follow the [demo instructions](https://github.com/OoDeLally/ra-data-graphql-simple-mongest-resolver/tree/master/demo-client).


# Setup

Install (if not already there) the peer dependencies:

```bash
npm install mongodb mongoose @nestjs/mongoose @apollo/gateway @nestjs/graphql apollo-server-core apollo-server-express graphql mongest-service
```

Then install the `ra-data-graphql-simple-mongest-resolver` lib:

```bash
npm install ra-data-graphql-simple-mongest-resolver
```

Now you can create your entity, your service, and your resolver:

```ts
@Schema()
export class Cat {
  @Field(() => String)
  @Prop({ required: true, type: String })
  name!: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
registerEntityClassForSchema(Cat, CatSchema);


@Injectable()
export class CatsService extends MongestService(Cat) {
  // Expandable service!
}

@Resolver(() => Cat)
export class CatsResolver extends BuildMongestRaResolver(Cat) {
  constructor(service: CatsService) {
    super(service);
  }
  // Expandable resolver!
}
```


## Features

### Out-of-the-box GraphQL NestJS resolver CRUD endpoints.

Just declare your entity, the service and the resolver will have automatic endpoints with the appropriate fields.
The generated endpoints are described in [ra-data-graphql-simple](https://github.com/marmelab/react-admin/tree/master/packages/ra-data-graphql-simple).


### Only fetches the required data

```gql
query {
  allCats {
    id
    name
    ...on StrayCat {
      territorySize
    }
    ...on HomeCat {
      humanSlave
    }
  }
}
```

generates the following mongo projection

```js
{
  _id: true,
  name: true,
  territorySize: true,
  humanSlave: true,
  age: true
}
```

so that only the required data is transfered from the DB to the final client.


### Fully customizable, overridable and expandable NestJS resolver.


```ts

// Add any custom filter. It will be added to the `allCats` endpoint arguments.
@InputType()
class CatFilter {
  @Field(() => String, { nullable: true })
  nameRegexp?: string;
}

// Tell how the CatFilter should be translated into a mongo filter
const graphqlFilterToMongoFilter = async ({ nameRegexp }: CatFilter): Promise<FilterQuery<Cat>> => {
  // The filter builder can be synchronous or asynchronous
  const filter: FilterQuery<Cat> = {};
  if (nameRegexp) {
    filter.name = new RegExp(escapeRegExp(nameRegexp), 'i');
  }
  return filter;
};

const CatsResolverOptions: MongestRaResolverOptions<Cat, CatFilter> = {
  filter: {
    classRef: CatFilter,
    filterBuilder: graphqlFilterToMongoFilter,
  },
  virtualFields: {
    fancyName: { dependsOn: ['name'] }, // Include `name` if the virtual field `fancyName` needs it to resolve (see the resolver below).
  },
  discriminatorRequiredExtraFields: ['age'], // e.g. if `age` is required in your graphql resolveType().
  endpoints: {
    update: {
      enable: true, // By default, for safety, only the readonly endpoints are enabled.
    },
    delete: {
      enable: true,
      guard: myPermissionGuard, // Add a guard to the `delete` endpoint.
      interceptor: myLoggerInterceptor, // Add an interceptor to the `delete` endpoint.
    },
    create: {
      args: {
        omitFields: ['color'], // Dont include `color` as `create`'s argument.
      },
    },
  },
};

@Resolver(() => Cat)
export class CatsResolver extends BuildMongestRaResolver(Cat, CatsResolverOptions) {
  constructor(service: CatsService) {
    super(service);
  }

  @ResolveField(() => String)
  async fancyName(@Parent() parent: { name: string }) {
    return `Fancy ${parent.name}`;
  }

  // Add new custom endpoints here
}

```

### Delightfully-typed Mongoose-wrapper NestJS-service

These resolvers are built on top of [Mongest Service](https://github.com/OoDeLally/mongest-service), which means you can also expand the NestJS service in order to reuse it anywhere in your app.

* NestJS Service that delicately wraps Mongoose methods for your favorite entities.
* All returned documents are leans, but casted as instance of their entity class.
* Amazing discriminator-based polymorphism!
* Precise and safe typing in and out for all mongoose functions (sensitive to projection!).
* Fully overridable and expandable NestJS service.
