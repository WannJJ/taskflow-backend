import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Global = module này dùng được ở mọi nơi không cần import
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export để module khác inject được
})
export class PrismaModule {}
