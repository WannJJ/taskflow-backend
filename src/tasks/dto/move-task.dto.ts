import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsInt } from 'class-validator';

/**
 * DTO dùng riêng cho việc kéo thả task giữa các cột Kanban
 * Cần cập nhật cả status (cột) lẫn position (thứ tự)
 */
export class MoveTaskDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ description: 'Vị trí mới trong cột' })
  @IsInt()
  position: number;
}
