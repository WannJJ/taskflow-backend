import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * ============================================
   * LẤY DANH SÁCH TASK
   * ============================================
   * Hỗ trợ filter theo: status, priority, projectId, search
   * Mặc định chỉ lấy task của user đang đăng nhập
   */
  async findAll(
    userId: string,
    query: {
      status?: TaskStatus;
      priority?: string;
      projectId?: string;
      search?: string;
    },
  ) {
    const where: any = { userId };

    // Filter theo status (TODO, IN_PROGRESS, DONE...)
    if (query.status) {
      where.status = query.status;
    }

    // Filter theo priority
    if (query.priority) {
      where.priority = query.priority;
    }

    // Filter theo project
    if (query.projectId) {
      where.projectId = query.projectId;
    }

    // Full-text search đơn giản: tìm trong title hoặc description
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: true,
        attachments: true,
      },
      orderBy: [
        { status: 'asc' }, // Sắp xếp theo cột trước
        { position: 'asc' }, // Sau đó theo thứ tự trong cột
        { createdAt: 'desc' },
      ],
    });

    return tasks;
  }

  /**
   * ============================================
   * LẤY CHI TIẾT 1 TASK
   * ============================================
   */
  async findOne(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        labels: true,
        attachments: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    // Kiểm tra quyền: chỉ owner mới được xem
    if (task.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem công việc này');
    }

    return task;
  }

  /**
   * ============================================
   * TẠO TASK MỚI
   * ============================================
   */
  async create(userId: string, dto: CreateTaskDto) {
    // Tính position mới: đặt ở cuối cột hiện tại
    const lastTask = await this.prisma.task.findFirst({
      where: {
        userId,
        status: dto.status || TaskStatus.TODO,
      },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastTask ? lastTask.position + 1 : 0;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        position: dto.position ?? newPosition,
        userId,
        projectId: dto.projectId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: true,
      },
    });

    return task;
  }

  /**
   * ============================================
   * CẬP NHẬT TASK
   * ============================================
   */
  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    // Kiểm tra task tồn tại và thuộc về user
    const existing = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa công việc này',
      );
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        position: dto.position,
        projectId: dto.projectId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: true,
      },
    });

    return task;
  }

  /**
   * ============================================
   * DI CHUYỂN TASK (KANBAN DRAG & DROP)
   * ============================================
   * Khi kéo thả giữa các cột hoặc reorder trong cùng cột
   */
  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    // Nếu đổi cột (status) → cần reorder các task khác
    if (task.status !== dto.status) {
      // Tăng position của các task trong cột mới từ vị trí chèn trở đi
      await this.prisma.task.updateMany({
        where: {
          userId,
          status: dto.status,
          position: { gte: dto.position },
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else if (task.position !== dto.position) {
      // Reorder trong cùng cột: đơn giản hóa bằng cách swap (trong thực tế cần logic phức tạp hơn)
      // Ở đây mình chỉ update position trực tiếp, frontend sẽ gửi position chính xác
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        position: dto.position,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: true,
      },
    });

    return updated;
  }

  /**
   * ============================================
   * XÓA TASK
   * ============================================
   */
  async remove(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true, message: 'Đã xóa công việc' };
  }
}
