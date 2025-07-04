import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ClientsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userId: number;
  let strategyId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Clean up database before tests
    await prismaService.client.deleteMany({});
    
    // Create a test user and strategy for foreign key relationships
    const user = await prismaService.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      }
    });
    userId = user.id;
    
    const strategy = await prismaService.strategy.create({
      data: {
        name: 'Test Strategy',
        description: 'Test strategy description'
      }
    });
    strategyId = strategy.id;
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prismaService.client.deleteMany({});
    await prismaService.strategy.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  const testClient = {
    name: 'Test Client',
    userId: null, // Will be set in beforeEach
    strategyId: null, // Will be set in beforeEach
    email: 'client@example.com',
    phone: '123-456-7890',
    company: 'Test Company',
    position: 'CEO',
    notes: 'Test notes'
  };

  let clientId: number;

  beforeEach(() => {
    testClient.userId = userId;
    testClient.strategyId = strategyId;
  });

  describe('/clients (POST)', () => {
    it('should create a new client', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('x-api-key', process.env.API_KEY)
        .send(testClient)
        .expect(201)
        .then(response => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe(testClient.name);
          expect(response.body.email).toBe(testClient.email);
          expect(response.body.userId).toBe(userId);
          expect(response.body.strategyId).toBe(strategyId);
          
          clientId = response.body.id;
        });
    });

    it('should not create a client with invalid data', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('x-api-key', process.env.API_KEY)
        .send({
          // Missing required fields
          email: 'invalid@example.com'
        })
        .expect(400);
    });
  });

  describe('/clients (GET)', () => {
    it('should return all clients', () => {
      return request(app.getHttpServer())
        .get('/clients')
        .set('x-api-key', process.env.API_KEY)
        .expect(200)
        .then(response => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0]).toHaveProperty('id');
          expect(response.body[0]).toHaveProperty('name');
          expect(response.body[0]).toHaveProperty('email');
        });
    });
  });

  describe('/clients/:id (GET)', () => {
    it('should return a client by id', () => {
      return request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('x-api-key', process.env.API_KEY)
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', clientId);
          expect(response.body).toHaveProperty('name', testClient.name);
          expect(response.body).toHaveProperty('email', testClient.email);
          expect(response.body).toHaveProperty('user');
          expect(response.body).toHaveProperty('strategy');
        });
    });

    it('should return 404 for non-existent client', () => {
      return request(app.getHttpServer())
        .get('/clients/9999')
        .set('x-api-key', process.env.API_KEY)
        .expect(404);
    });
  });

  describe('/clients/user/:userId (GET)', () => {
    it('should return clients for a specific user', () => {
      return request(app.getHttpServer())
        .get(`/clients/user/${userId}`)
        .set('x-api-key', process.env.API_KEY)
        .expect(200)
        .then(response => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0]).toHaveProperty('userId', userId);
        });
    });
  });

  describe('/clients/:id (PATCH)', () => {
    it('should update a client', () => {
      const updatedName = 'Updated Client';
      
      return request(app.getHttpServer())
        .patch(`/clients/${clientId}`)
        .set('x-api-key', process.env.API_KEY)
        .send({ name: updatedName })
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', clientId);
          expect(response.body).toHaveProperty('name', updatedName);
          expect(response.body).toHaveProperty('email', testClient.email);
        });
    });
  });

  describe('/clients/:id (DELETE)', () => {
    it('should delete a client', () => {
      return request(app.getHttpServer())
        .delete(`/clients/${clientId}`)
        .set('x-api-key', process.env.API_KEY)
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', clientId);
        });
    });

    it('should return 404 after client is deleted', () => {
      return request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('x-api-key', process.env.API_KEY)
        .expect(404);
    });
  });
});
