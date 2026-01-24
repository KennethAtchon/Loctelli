import { test, expect, describe, beforeEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    test('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });

    test('should always return the same string', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();
      expect(result1).toBe(result2);
      expect(result1).toBe('Hello World!');
    });
  });
});
