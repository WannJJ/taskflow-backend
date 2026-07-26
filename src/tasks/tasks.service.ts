import { Injectable, NotFoundException } from '@nestjs/common';
import { Priority, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: { status?: TaskStatus; priority?: string; search?: string },
  ) {
    const where: Prisma.TaskWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority as Priority;
    }

    if (filters.search) {
      where.OR = [
        {
          title: {
            contains: filters.search,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
      // ❌ Bỏ include vì schema không có Project/Label
    });

    const grouped = {
      BACKLOG: tasks.filter((t) => t.status === TaskStatus.BACKLOG),
      TODO: tasks.filter((t) => t.status === TaskStatus.TODO),
      IN_PROGRESS: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      DONE: tasks.filter((t) => t.status === TaskStatus.DONE),
    };

    return { tasks, grouped };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      // ❌ Bỏ include
    });

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const maxPosition = await this.prisma.task.aggregate({
      where: { userId, status: dto.status || TaskStatus.TODO },
      _max: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        ...dto,
        userId,
        position: (maxPosition._max.position ?? 0) + 1,
      },
      // ❌ Bỏ include
    });

    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Task không tồn tại');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: dto,
      // ❌ Bỏ include
    });

    return updated;
  }

  async move(id: string, userId: string, dto: MoveTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Task không tồn tại');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status,
        position: dto.position,
      },
      // ❌ Bỏ include
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Task không tồn tại');
    }

    await this.prisma.task.delete({ where: { id } });
    return { id };
  }
}
