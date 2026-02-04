import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/core/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { getApiKey } from './test-utils';

describe('StrategiesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up database before tests
    await prismaService.strategy.deleteMany({});

    await app.init();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prismaService.strategy.deleteMany({});
    await app.close();
  });

  const testStrategy = {
    name: 'Test Strategy',
    description: 'A test strategy for e2e testing',
  };

  let strategyId: number;

  describe('/strategies (POST)', () => {
    test('should create a new strategy', async () => {
      const response = await request(app.getHttpServer())
        .post('/strategies')
        .set('x-api-key', getApiKey())
        .send(testStrategy)
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testStrategy.name);
      expect(response.body.description).toBe(testStrategy.description);

      strategyId = response.body.id;
    });

    test('should not create a strategy with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/strategies')
        .set('x-api-key', getApiKey())
        .send({
          // Missing name
          description: 'Invalid strategy',
        })
        .expect(400);
    });
  });

  describe('/strategies (GET)', () => {
    test('should return all strategies', async () => {
      const response = await request(app.getHttpServer())
        .get('/strategies')
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    });
  });

  describe('/strategies/:id (GET)', () => {
    test('should return a strategy by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/strategies/${strategyId}`)
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(response.body).toHaveProperty('id', strategyId);
      expect(response.body).toHaveProperty('name', testStrategy.name);
      expect(response.body).toHaveProperty(
        'description',
        testStrategy.description,
      );
    });

    test('should return 404 for non-existent strategy', async () => {
      await request(app.getHttpServer())
        .get('/strategies/9999')
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });

  describe('/strategies/:id (PATCH)', () => {
    test('should update a strategy', async () => {
      const updatedName = 'Updated Strategy';

      const response = await request(app.getHttpServer())
        .patch(`/strategies/${strategyId}`)
        .set('x-api-key', getApiKey())
        .send({ name: updatedName })
        .expect(200);
      expect(response.body).toHaveProperty('id', strategyId);
      expect(response.body).toHaveProperty('name', updatedName);
      expect(response.body).toHaveProperty(
        'description',
        testStrategy.description,
      );
    });
  });

  describe('/strategies/:id (DELETE)', () => {
    test('should delete a strategy', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/strategies/${strategyId}`)
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(response.body).toHaveProperty('id', strategyId);
    });

    test('should return 404 after strategy is deleted', async () => {
      await request(app.getHttpServer())
        .get(`/strategies/${strategyId}`)
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });
});
