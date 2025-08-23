import { TokensService } from './tokens.service';
import { Body, Controller, Post, Delete, Res } from '@nestjs/common';
import { ApiResponse } from '@/types/api-response/api-response';
import {
  TokensSignInRequestDto,
  TokensSignInResponseDto,
  TokensSignOutResponseDto,
} from './tokens.dto';
import { ZodResponse } from 'nestjs-zod';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
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
    const { accessTokenExpiresIn, ...tokens } = await this.tokensService.signIn(
      email,
      password,
    );

    res.cookie('isLoggedIn', 'true', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: accessTokenExpiresIn * 1000,
    });

    return ApiResponse.Ok('Tokens generated', tokens);
  }

  @Post('revoke')
  @ZodResponse({
    status: 200,
    description: 'Sign out',
    type: TokensSignOutResponseDto,
  })
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('isLoggedIn', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
    });

    return ApiResponse.Ok('Successfully signed out');
  }
}
