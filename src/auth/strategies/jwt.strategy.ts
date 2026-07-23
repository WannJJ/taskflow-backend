import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // Lấy token từ header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Không ignore expiration (mặc định false, nhưng ghi rõ cho chắc)
      ignoreExpiration: false,
      // Secret key để verify token
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // Hàm này chạy sau khi token đã được verify
  // Return value sẽ được gắn vào req.user
  async validate(payload: { sub: string; email: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
