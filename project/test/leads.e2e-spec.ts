import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/core/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { getApiKey } from './test-utils';

describe('LeadsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userId: number;
  let strategyId: number;
  let subAccountId: number;
  let adminUserId: number;
  let promptTemplateId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up database before tests
    await prismaService.lead.deleteMany({});
    await prismaService.strategy.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.subAccount.deleteMany({});
    await prismaService.adminUser.deleteMany({});
    await prismaService.promptTemplate.deleteMany({});

    // Create required relationships
    const adminUser = await prismaService.adminUser.create({
      data: {
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'password123'
      }
    });
    adminUserId = adminUser.id;

    const subAccount = await prismaService.subAccount.create({
      data: {
        name: 'Test SubAccount',
        createdByAdminId: adminUserId
      }
    });
    subAccountId = subAccount.id;

    const promptTemplate = await prismaService.promptTemplate.create({
      data: {
        name: 'Test Prompt Template',
        systemPrompt: 'Test system prompt',
        createdByAdminId: adminUserId
      }
    });
    promptTemplateId = promptTemplate.id;

    const user = await prismaService.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        subAccountId: subAccountId,
        createdByAdminId: adminUserId
      }
    });
    userId = user.id;

    const strategy = await prismaService.strategy.create({
      data: {
        name: 'Test Strategy',
        regularUserId: userId,
        subAccountId: subAccountId,
        promptTemplateId: promptTemplateId
      }
    });
    strategyId = strategy.id;
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prismaService.lead.deleteMany({});
    await prismaService.strategy.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.subAccount.deleteMany({});
    await prismaService.adminUser.deleteMany({});
    await prismaService.promptTemplate.deleteMany({});
    await app.close();
  });

  const testLead = {
    name: 'Test Lead',
    regularUserId: 0, // Will be set in beforeEach
    strategyId: 0, // Will be set in beforeEach
    subAccountId: 0, // Will be set in beforeEach
    email: 'lead@example.com',
    phone: '123-456-7890',
    company: 'Test Company',
    position: 'CEO',
    notes: 'Test notes'
  };

  let leadId: number;

  beforeEach(() => {
    testLead.regularUserId = userId;
    testLead.strategyId = strategyId;
    testLead.subAccountId = subAccountId;
  });

  describe('/leads (POST)', () => {
    it('should create a new lead', () => {
      return request(app.getHttpServer())
        .post('/leads')
        .set('x-api-key', getApiKey())
        .send(testLead)
        .expect(201)
        .then(response => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe(testLead.name);
          expect(response.body.email).toBe(testLead.email);
          expect(response.body.regularUserId).toBe(userId);
          expect(response.body.strategyId).toBe(strategyId);
          
          leadId = response.body.id;
        });
    });

    it('should not create a lead with invalid data', () => {
      return request(app.getHttpServer())
        .post('/leads')
        .set('x-api-key', getApiKey())
        .send({
          // Missing required fields
          email: 'invalid@example.com'
        })
        .expect(400);
    });
  });

  describe('/leads (GET)', () => {
    it('should return all leads', () => {
      return request(app.getHttpServer())
        .get('/leads')
        .set('x-api-key', getApiKey())
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

  describe('/leads/:id (GET)', () => {
    it('should return a lead by id', () => {
      return request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('x-api-key', getApiKey())
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', leadId);
          expect(response.body).toHaveProperty('name', testLead.name);
          expect(response.body).toHaveProperty('email', testLead.email);
          expect(response.body).toHaveProperty('user');
          expect(response.body).toHaveProperty('strategy');
        });
    });

    it('should return 404 for non-existent lead', () => {
      return request(app.getHttpServer())
        .get('/leads/9999')
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });

  describe('/leads/user/:userId (GET)', () => {
    it('should return leads for a specific user', () => {
      return request(app.getHttpServer())
        .get(`/leads/user/${userId}`)
        .set('x-api-key', getApiKey())
        .expect(200)
        .then(response => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0]).toHaveProperty('regularUserId', userId);
        });
    });
  });

  describe('/leads/:id (PATCH)', () => {
    it('should update a lead', () => {
      const updatedName = 'Updated Lead';
      
      return request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .set('x-api-key', getApiKey())
        .send({ name: updatedName })
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', leadId);
          expect(response.body).toHaveProperty('name', updatedName);
          expect(response.body).toHaveProperty('email', testLead.email);
        });
    });
  });

  describe('/leads/:id (DELETE)', () => {
    it('should delete a lead', () => {
      return request(app.getHttpServer())
        .delete(`/leads/${leadId}`)
        .set('x-api-key', getApiKey())
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('id', leadId);
        });
    });

    it('should return 404 after lead is deleted', () => {
      return request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('x-api-key', getApiKey())
        .expect(404);
    });
  });
});
