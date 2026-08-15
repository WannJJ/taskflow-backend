import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO (Data Transfer Object) dùng để validate dữ liệu
 * khi tạo Note mới.
 *
 * @ApiProperty giúp Swagger hiển thị đúng schema trong /api/docs
 */
export class CreateNoteDto {
  @ApiProperty({ example: 'Học NestJS', description: 'Tiêu đề ghi chú' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  title: string;

  @ApiPropertyOptional({
    example: '{"type":"doc","content":[...]}',
    description: 'Nội dung dạng JSON string từ TipTap',
  })
  @IsOptional()
  @IsString()
  // Lưu ý: Frontend gửi JSON.stringify() của TipTap content
  content?: string;

  @ApiPropertyOptional({ example: false, description: 'Ghim lên đầu' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID project (optional)',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
