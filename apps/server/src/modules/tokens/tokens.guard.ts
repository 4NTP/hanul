import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokensService } from './tokens.service';

@Injectable()
export class TokensGuard implements CanActivate {
  constructor(private readonly tokensService: TokensService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Invalid tokens');
    }

    try {
      const decoded = await this.tokensService.decodeToken(accessToken);
      request.user = decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid tokens');
    }

    return true;
  }
}
