import { TaskStatus } from '@prisma/client';
import { IsEnum, IsInt } from 'class-validator';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  position: number;
}
