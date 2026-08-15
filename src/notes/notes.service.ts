import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo note mới.
   * userId lấy từ JWT token (đã được JwtStrategy gắn vào req.user).
   */
  async create(userId: string, dto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content || '', // Nếu không có content thì để chuỗi rỗng
        isPinned: dto.isPinned ?? false,
        userId: userId,
        projectId: dto.projectId || null,
      },
      // include để trả về cả thông tin project (nếu có)
      include: {
        project: { select: { id: true, name: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    });

    return note;
  }

  /**
   * Lấy danh sách notes của user.
   * Hỗ trợ:
   * - search: tìm trong title và content (không phân biệt hoa thường)
   * - projectId: lọc theo project
   * - isPinned: lọc note đã ghim
   *
   * Sắp xếp: pinned lên đầu, sau đó theo updatedAt mới nhất.
   */
  async findAll(
    userId: string,
    query: { search?: string; projectId?: string; isPinned?: boolean },
  ) {
    const where: any = { userId };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.isPinned !== undefined) {
      where.isPinned = query.isPinned;
    }

    // Tìm kiếm full-text đơn giản (case-insensitive)
    // mode: 'insensitive' trong Prisma giúp search không phân biệt
    // Hoa vs hoa. Đây là feature của PostgreSQL provider trong Prisma.
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const notes = await this.prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' }, // Ghim lên đầu
        { updatedAt: 'desc' }, // Mới nhất lên đầu
      ],
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    });

    return notes;
  }

  /**
   * Lấy chi tiết 1 note.
   * Kiểm tra quyền sở hữu: chỉ owner mới được xem.
   */
  async findOne(userId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    });

    if (!note) {
      throw new NotFoundException('Ghi chú không tồn tại');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem ghi chú này');
    }

    return note;
  }

  /**
   * Cập nhật note.
   * Chỉ owner mới được sửa.
   */
  async update(userId: string, noteId: string, dto: UpdateNoteDto) {
    // Kiểm tra tồn tại + quyền
    const existing = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundException('Ghi chú không tồn tại');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa ghi chú này');
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        ...dto,
        updatedAt: new Date(), // Prisma tự cập nhật nhưng để rõ ràng
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    });

    return updated;
  }

  /**
   * Xóa note.
   */
  async remove(userId: string, noteId: string) {
    const existing = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundException('Ghi chú không tồn tại');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa ghi chú này');
    }

    await this.prisma.note.delete({ where: { id: noteId } });

    return { success: true, message: 'Đã xóa ghi chú' };
  }
}
