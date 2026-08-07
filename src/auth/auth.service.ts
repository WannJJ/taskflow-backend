import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// ============================================
// Interface cho JWT Payload
// Giúp TypeScript biết payload có những field gì
// thay vì để là `any`
// ============================================
interface JwtPayload {
  sub: string; // userId
  email: string; // email
  iat: number; // issued at (timestamp)
  exp: number; // expiration (timestamp)
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // REGISTER - Đăng ký tài khoản mới
  // ============================================
  async register(dto: RegisterDto) {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password với bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    // Tạo cặp token
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ============================================
  // LOGIN - Đăng nhập
  // ============================================
  async login(dto: LoginDto) {
    // Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // So sánh password đã hash
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo cặp token
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ============================================
  // REFRESH TOKENS - Làm mới access token
  // ============================================
  /**
   * Flow refresh token (Token Rotation):
   * 1. Client gửi refreshToken cũ
   * 2. Verify JWT signature có hợp lệ không
   * 3. Kiểm tra token có trong DB và chưa hết hạn
   * 4. XÓA token cũ khỏi DB (1 token chỉ dùng 1 lần - bảo mật cao)
   * 5. Tạo cặp token MỚI
   * 6. Trả về client
   */
  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verify JWT signature
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // 2. Kiểm tra token có tồn tại trong DB không
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new ForbiddenException('Refresh token không hợp lệ');
      }

      // 2.5. Double-check: userId trong JWT payload có khớp với DB không
      // payload.sub chính là userId được gắn khi tạo token trong generateTokens()
      if (storedToken.user.id !== payload.sub) {
        throw new ForbiddenException('Token không khớp với user');
      }

      // 3. Kiểm tra token đã hết hạn chưa
      if (new Date() > storedToken.expiresAt) {
        // Xóa token hết hạn
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new ForbiddenException(
          'Refresh token đã hết hạn, vui lòng đăng nhập lại',
        );
      }

      // 4. TOKEN ROTATION: Xóa token cũ (mỗi refresh token chỉ dùng 1 lần)
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

      // 5. Tạo token mới
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      // Xử lý các lỗi JWT cụ thể
      // Trong TypeScript strict mode, biến trong catch block
      // có kiểu `unknown` (không phải `Error`). Không thể truy cập `.name`
      // trực tiếp mà không type guard.
      // Vậy nên: Dùng `instanceof Error` để type-narrowing.
      // Sau khi check, TS biết chắc `error` là `Error` nên `.name` hợp lệ.
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new ForbiddenException('Refresh token đã hết hạn');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new ForbiddenException('Refresh token không hợp lệ');
        }
      }
      // Nếu không phải Error instance (hiếm), throw lại nguyên bản
      throw error;
    }
  }

  // ============================================
  // LOGOUT - Đăng xuất 1 thiết bị
  // ============================================
  async logout(refreshToken: string) {
    // Xóa refresh token khỏi DB
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Đăng xuất thành công' };
  }

  // ============================================
  // LOGOUT ALL - Đăng xuất khỏi TẤT CẢ thiết bị
  // ============================================
  async logoutAll(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Đã đăng xuất khỏi tất cả thiết bị' };
  }

  // ============================================
  // GET PROFILE - Lấy thông tin user
  // ============================================
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return user;
  }

  // ============================================
  // PRIVATE: Generate Tokens (access + refresh token)
  // ============================================
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    // Access Token: ngắn hạn (15 phút), chứa thông tin user
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
    });

    // Refresh Token: dài hạn (7 ngày), chỉ để đổi access token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Lưu refresh token vào DB để có thể revoke sau này
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
