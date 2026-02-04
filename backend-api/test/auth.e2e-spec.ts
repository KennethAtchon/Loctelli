import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/core/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      company: 'Test Company',
      budget: '1000-5000',
    };

    test('should register a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('company', 'Test Company');
      expect(res.body).toHaveProperty('budget', '1000-5000');
      expect(res.body).not.toHaveProperty('password');
    });

    test('should reject registration with invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          email: 'invalid-email',
        })
        .expect(400);
      expect(res.body.message).toContain('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          password: 'weak',
        })
        .expect(400);
      expect(res.body.message).toContain(
        'Password must be at least 8 characters long',
      );
    });

    test('should reject duplicate email registration', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      // Second registration with same email
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);
      expect(res.body.message).toContain('User with this email already exists');
    });
  });

  describe('/auth/login (POST)', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Register a user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          company: 'Test Company',
        })
        .expect(201);
    });

    test('should login successfully with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validLoginData)
        .expect(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('name', 'Test User');
    });

    test('should reject login with invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...validLoginData,
          email: 'invalid-email',
        })
        .expect(400);
      expect(res.body.message).toContain('Invalid email format');
    });

    test('should reject login with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...validLoginData,
          password: 'WrongPassword123!',
        })
        .expect(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          company: 'Test Company',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      accessToken = loginResponse.body.access_token;
    });

    test('should get user profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('company', 'Test Company');
    });

    test('should reject profile access without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    test('should reject profile access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          company: 'Test Company',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      refreshToken = loginResponse.body.refresh_token;
    });

    test('should refresh tokens successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.access_token).not.toBe(refreshToken);
      expect(res.body.refresh_token).not.toBe(refreshToken);
    });

    test('should reject refresh with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);
      expect(res.body.message).toContain('Invalid refresh token');
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          company: 'Test Company',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      accessToken = loginResponse.body.access_token;
    });

    test('should logout successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.message).toBe('Logged out successfully');
    });

    test('should reject logout without token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('/auth/change-password (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          company: 'Test Company',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      accessToken = loginResponse.body.access_token;
    });

    test('should change password successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        })
        .expect(200);
      expect(res.body.message).toBe('Password changed successfully');
    });

    test('should reject password change with wrong old password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
      expect(res.body.message).toContain('Current password is incorrect');
    });

    test('should reject password change with weak new password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'Password123!',
          newPassword: 'weak',
        })
        .expect(400);
      expect(res.body.message).toContain(
        'Password must be at least 8 characters long',
      );
    });

    test('should reject password change without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({
          oldPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });
});
