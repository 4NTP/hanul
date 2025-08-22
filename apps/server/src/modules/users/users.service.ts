import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { User } from '@/generated/prisma';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async signUp(name: string, email: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return user;
  }
}
