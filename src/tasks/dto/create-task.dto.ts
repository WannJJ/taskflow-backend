import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * DTO để tạo Task mới
 * Client gửi lên → Backend validate → Lưu DB
 */
export class CreateTaskDto {
  @ApiProperty({ example: 'Viết API cho Task Management' })
  @IsString()
  @MinLength(1, { message: 'Tiêu đề không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: 'Mô tả chi tiết công việc cần làm...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ example: '2026-08-10T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 0, description: 'Thứ tự trong cột Kanban' })
  @IsOptional()
  @IsInt()
  position?: number;

  @ApiProperty({ example: 'project-uuid-123' })
  @IsString()
  projectId: string;
}
