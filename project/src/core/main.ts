import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://loctelli_frontend:3000',
      'http://frontend:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-API-Key',
      'x-api-key',
      'X-User-Token',
      'x-user-token'
    ],
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
