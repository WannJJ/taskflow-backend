import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Tự động kết nối DB khi module khởi động
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    // Tự động ngắt kết nối khi app tắt
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }
}
