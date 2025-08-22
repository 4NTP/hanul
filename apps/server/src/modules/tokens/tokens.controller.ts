import { TokensService } from './tokens.service';
import { Body, Controller, Post, Delete, Res } from '@nestjs/common';
import { ApiResponse } from '@/types/api-response/api-response';
import {
  TokensSignInRequestDto,
  TokensSignInResponseDto,
  TokensSignOutResponseDto,
} from './tokens.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ZodResponse } from 'nestjs-zod';
import { Env } from '../config/env.schema';

@Controller('tokens')
export class TokensController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService<Env>,
  ) {}

  @Post()
  @ZodResponse({
    status: 200,
    description: 'Create access and refresh tokens',
    type: TokensSignInResponseDto,
  })
  async signIn(
    @Body() { email, password }: TokensSignInRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessTokenExpiresIn, refreshTokenExpiresIn, ...tokens } =
      await this.tokensService.signIn(email, password);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: accessTokenExpiresIn * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: refreshTokenExpiresIn * 1000,
    });

    return ApiResponse.Ok('Tokens generated', tokens);
  }

  @Delete()
  @ZodResponse({
    status: 200,
    description: 'Sign out and clear cookies',
    type: TokensSignOutResponseDto,
  })
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
    });

    return ApiResponse.Ok('Successfully signed out');
  }
}
