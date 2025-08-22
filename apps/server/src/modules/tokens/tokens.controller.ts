import { TokensService } from './tokens.service';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiResponse } from '@/types/api-response/api-response';
import { TokensSignInRequestDto, TokensSignInResponseDto } from './tokens.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ZodResponse } from 'nestjs-zod';

@Controller('tokens')
export class TokensController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ZodResponse({
    status: 200,
    description: 'Create access and refresh tokens',
    type: TokensSignInResponseDto,
  })
  async signIn(
    @Body() { email, password }: TokensSignInRequestDto,
    @Res() res: Response,
  ) {
    const { accessTokenExpiresIn, refreshTokenExpiresIn, ...tokens } =
      await this.tokensService.signIn(email, password);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: accessTokenExpiresIn,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: refreshTokenExpiresIn,
    });

    return ApiResponse.Ok('Tokens generated', tokens);
  }
}
