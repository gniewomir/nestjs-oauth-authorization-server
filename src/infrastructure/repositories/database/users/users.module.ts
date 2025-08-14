import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "@infrastructure/database/entities/user.entity";
import { UsersRepository } from "@infrastructure/repositories/database/users/users.repository";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersRepository],
})
export class UsersModule {}
