import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

/**
 * DTO cập nhật Task
 * Dùng PartialType để tất cả field đều optional
 * Chỉ cập nhật những field client gửi lên
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
