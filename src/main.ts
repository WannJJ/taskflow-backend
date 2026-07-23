import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS - cho phép frontend gọi API
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Cho phép gửi cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation pipe - tự động validate DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ field không có trong DTO
      forbidNonWhitelisted: true, // Throw lỗi nếu có field không hợp lệ
      transform: true, // Tự động transform type (string → number nếu có @IsNumber())
    }),
  );

  // Global prefix cho API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

bootstrap();
