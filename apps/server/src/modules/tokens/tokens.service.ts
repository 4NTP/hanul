import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../db/db.service';
import { ApiResponseError } from '@/types/api-response/api-response-error';
import bcrypt from 'bcrypt';
import { Env } from '../config/env.schema';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    private readonly db: DbService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
  }> {
    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiResponseError.NotFound('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiResponseError.Unauthorized('Invalid password');
    }

    const iat = Math.floor(Date.now() / 1000);
    const accessTokenExpiresIn = 7 * 60 * 60; // 7 hours
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days

    const accessPayload = {
      iss: this.configService.get('JWT_ISSUER'),
      iat,
      exp: iat + accessTokenExpiresIn,
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    const refreshPayload = {
      iss: this.configService.get('JWT_ISSUER'),
      iat,
      exp: iat + refreshTokenExpiresIn,
      sub: user.id,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get('JWT_SECRET'),
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  async decodeToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.decode(
        token,
        this.configService.get('JWT_SECRET'),
      );
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid tokens');
    }
  }
}
