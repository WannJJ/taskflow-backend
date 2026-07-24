import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

// PartialType: tất cả field đều optional, kế thừa validation từ CreateTaskDto
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
