import { Module } from "@nestjs/common";

import { UserDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.module";
import { PasswordModule } from "@infrastructure/security/password";

import { UsersService } from "./users.service";

@Module({
  imports: [UserDomainRepositoryModule, PasswordModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
