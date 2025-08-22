import { UsersService } from './users.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse } from '@/types/api-response/api-response';
import { UsersSignUpRequestDto, UsersSignUpResponseDto } from './users.dto';
import { ZodResponse } from 'nestjs-zod';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ZodResponse({
    status: 200,
    description: 'Create user',
    type: UsersSignUpResponseDto,
  })
  async signUp(@Body() { name, email, password }: UsersSignUpRequestDto) {
    const user = await this.usersService.signUp(name, email, password);

    return ApiResponse.Ok('User created', { userId: user.id });
  }
}
