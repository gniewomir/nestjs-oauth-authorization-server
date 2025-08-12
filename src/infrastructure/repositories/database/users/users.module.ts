import { UsersRepository } from "@infrastructure/repositories/database/users/users.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { User } from "@infrastructure/database/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersRepository],
})
export class UsersModule {}
