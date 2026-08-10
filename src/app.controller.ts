import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  /**
   * Health check endpoint
   * Dùng để kiểm tra server có đang chạy không
   * Docker/Railway sẽ ping endpoint này
   */
  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra trạng thái server' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'taskflow-backend',
    };
  }
}
