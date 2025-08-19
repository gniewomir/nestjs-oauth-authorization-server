import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User/Users.interface";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";

import { UserDomainRepository } from "./User.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseUser])],
  providers: [
    {
      provide: UsersInterfaceSymbol,
      useClass: UserDomainRepository,
    },
  ],
  exports: [UsersInterfaceSymbol],
})
export class UserDomainRepositoryModule {}
