import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: tokens.accessToken,
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: tokens.accessToken,
    };
  }

  async refresh(res: Response, refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.refreshToken) throw new UnauthorizedException();

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) throw new UnauthorizedException();

      const tokens = await this.generateTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      this.setRefreshCookie(res, tokens.refreshToken);

      return { accessToken: tokens.accessToken };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout(res: Response, userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
