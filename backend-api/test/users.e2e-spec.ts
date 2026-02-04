import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/core/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { getApiKey } from './test-utils';

describe('UsersController (e2e)', () => {
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
    await prismaService.user.deleteMany({});

    await app.init();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prismaService.user.deleteMany({});
    await app.close();
  });

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let userId: number;

  describe('/users (POST)', () => {
    test('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', getApiKey())
        .send(testUser)
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testUser.name);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned

      userId = response.body.id;
    });

    test('should not create a user with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', getApiKey())
        .send({
          name: 'Invalid User',
          // Missing email
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    test('should return all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });
  });

  describe('/users/:id (GET)', () => {
    test('should return a user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    test('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/9999')
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    test('should update a user', async () => {
      const updatedName = 'Updated User';

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('x-api-key', getApiKey())
        .send({ name: updatedName })
        .expect(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', updatedName);
      expect(response.body).toHaveProperty('email', testUser.email);
    });
  });

  describe('/users/:id (DELETE)', () => {
    test('should delete a user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('x-api-key', getApiKey())
        .expect(200);
      expect(response.body).toHaveProperty('id', userId);
    });

    test('should return 404 after user is deleted', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });
});
