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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard) // Tất cả routes đều cần đăng nhập
@ApiBearerAuth() // Hiển thị khóa lock trong Swagger
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo ghi chú mới' })
  async create(@Body() dto: CreateNoteDto, @Request() req) {
    const note = await this.notesService.create(req.user.id, dto);
    return { success: true, data: note };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ghi chú' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm trong title/content',
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'isPinned', required: false, type: Boolean })
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('isPinned') isPinned?: string,
  ) {
    const notes = await this.notesService.findAll(req.user.id, {
      search,
      projectId,
      isPinned:
        isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    });
    return { success: true, data: notes };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 ghi chú' })
  async findOne(@Param('id') id: string, @Request() req) {
    const note = await this.notesService.findOne(req.user.id, id);
    return { success: true, data: note };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ghi chú' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Request() req,
  ) {
    const note = await this.notesService.update(req.user.id, id, dto);
    return { success: true, data: note };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ghi chú' })
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.notesService.remove(req.user.id, id);
    return { success: true, data: result };
  }
}
