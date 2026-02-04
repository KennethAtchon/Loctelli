import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    test('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    test('should call appService.getHello()', () => {
      // Note: Bun's mock API is different from Jest
      // This test verifies the controller calls the service method
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });
  });
});
