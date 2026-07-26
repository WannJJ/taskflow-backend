import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ============================================
  // 1. CORS - Cho phép Frontend gọi API
  // ============================================
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true, // Cho phép gửi cookie (refresh token)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // ============================================
  // 2. Global Validation Pipe
  // Tự động validate DTO dựa trên class-validator
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ field không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có field thừa
      transform: true, // Tự động convert type (string -> number, v.v.)
    }),
  );

  // ============================================
  // 3. Global Prefix
  // ============================================
  app.setGlobalPrefix('api');

  // ============================================
  // 4. Swagger API Docs (tại /api/docs)
  // ============================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription(
      'API documentation for TaskFlow - Personal Productivity Workspace',
    )
    .setVersion('1.0')
    .addBearerAuth() // Hỗ trợ JWT token trong Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ============================================
  // 5. Start Server
  // ============================================
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
