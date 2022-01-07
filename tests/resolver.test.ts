import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ortieCat, pogoCat, safiCat, silverCat } from './cat-module/cat-test-data';
import { CatModule } from './cat-module/cat.module';
import { CatsService } from './cat-module/cat.service';
import { databaseModule, MongodInstance } from './database.module';
import { graphqlModule } from './graphql.module';
// import { waitLong } from './helpers/waitLong';
import { HomeCatModule } from './home-cat-module/home-cat.module';
import { INTROSPECTION_QUERY, INTROSPECTION_QUERY_EXPECTED } from './introspection';
import { StrayCatModule } from './stray-cat-module/stray-cat.module';

describe('CatsResolver', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  before(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [databaseModule, graphqlModule, CatModule, HomeCatModule, StrayCatModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(1234);
  });
  after(async () => {
    await MongodInstance.stop();
    await app.close();
  });
  beforeEach(async function () {
    const catService = moduleRef.get<CatsService>(CatsService);
    await catService.deleteMany({});
    await catService.insertMany([pogoCat, safiCat, ortieCat, silverCat]);
    // const docs = await catService.find({})
    // console.log("docs", docs);
  });

  describe('Basic Resolver: Introspection', () => {
    it('should return correct introspection data', async function () {
      // await waitLong(this);
      return request(await app.getUrl())
        .post('/graphql')
        .send({ query: INTROSPECTION_QUERY })
        .expect(200)
        .expect(INTROSPECTION_QUERY_EXPECTED);
    });
  });
});
