import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types/request.types';

/**
 * ============================================
 * @CurrentUser() DECORATOR
 * ============================================
 * Thay vì viết @Req() req rồi lấy req.user,
 * bạn chỉ cần viết: @CurrentUser() user: RequestUser
 *
 * Code sạch hơn, type-safe, không còn warning!
 *
 * Ví dụ:
 *   async findAll(@CurrentUser() user: RequestUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestWithUser['user'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Nếu truyền tên field (ví dụ: @CurrentUser('email')), chỉ trả field đó
    return data ? user?.[data] : user;
  },
);
