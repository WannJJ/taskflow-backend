import { PartialType } from '@nestjs/swagger';
import { CreateNoteDto } from './create-note.dto';

/**
 * UpdateNoteDto kế thừa toàn bộ từ CreateNoteDto
 * nhưng tất cả fields đều optional nhờ PartialType.
 *
 * Điều này giúp user chỉ gửi những field cần cập nhật
 * (vd: chỉ đổi title, không gửi content).
 */
export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
