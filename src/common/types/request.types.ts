/**
 * ============================================
 * REQUEST TYPES - Mở rộng Express Request
 * ============================================
 * Express Request gốc không có .user
 * Passport JWT Strategy tự gắn user vào req lúc runtime
 * Interface này giúp TypeScript hiểu req.user tồn tại
 * (Để xóa warning trong tasks.controller.ts)
 */

export interface RequestUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Mở rộng Express Request để có thêm user
 * Dùng trong controller: @Req() req: RequestWithUser
 */
export interface RequestWithUser extends Request {
  user: RequestUser;
}
