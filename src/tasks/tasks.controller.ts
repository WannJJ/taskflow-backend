import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard) // Tất cả route đều cần đăng nhập
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  /**
   * GET /api/tasks
   * Lấy danh sách task có hỗ trợ filter
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách công việc' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Request() req,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    const tasks = await this.tasksService.findAll(req.user.id, {
      status,
      priority,
      projectId,
      search,
    });
    return { success: true, data: tasks };
  }

  /**
   * GET /api/tasks/:id
   * Lấy chi tiết 1 task
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết công việc' })
  async findOne(@Param('id') id: string, @Request() req) {
    const task = await this.tasksService.findOne(id, req.user.id);
    return { success: true, data: task };
  }

  /**
   * POST /api/tasks
   * Tạo task mới
   */
  @Post()
  @ApiOperation({ summary: 'Tạo công việc mới' })
  async create(@Body() dto: CreateTaskDto, @Request() req) {
    const task = await this.tasksService.create(req.user.id, dto);
    return { success: true, data: task };
  }

  /**
   * PATCH /api/tasks/:id
   * Cập nhật task
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật công việc' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req,
  ) {
    const task = await this.tasksService.update(id, req.user.id, dto);
    return { success: true, data: task };
  }

  /**
   * PATCH /api/tasks/:id/move
   * Di chuyển task (Kanban drag & drop)
   */
  @Patch(':id/move')
  @ApiOperation({ summary: 'Di chuyển công việc (Kanban)' })
  async move(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @Request() req,
  ) {
    const task = await this.tasksService.move(id, req.user.id, dto);
    return { success: true, data: task };
  }

  /**
   * DELETE /api/tasks/:id
   * Xóa task
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa công việc' })
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.tasksService.remove(id, req.user.id);
    return { success: true, data: result };
  }
}
