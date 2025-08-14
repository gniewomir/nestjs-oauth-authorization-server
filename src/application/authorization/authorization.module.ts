import { Module } from "@nestjs/common";

import { AuthorizationCodeModule } from "@infrastructure/authentication/authorization-code/authorization-code.module";
import { JwtModule } from "@infrastructure/authentication/jwt";
import { PasswordModule } from "@infrastructure/authentication/password";
import { PKCEModule } from "@infrastructure/authentication/pkce";
import { ClockModule } from "@infrastructure/clock";
import { ConfigModule } from "@infrastructure/config";
import { ClientDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository.module";
import { RequestDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository.module";
import { UserDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.module";

import { AuthorizationService } from "./authorization.service";

@Module({
  imports: [
    RequestDomainRepositoryModule,
    ClientDomainRepositoryModule,
    UserDomainRepositoryModule,
    PasswordModule,
    AuthorizationCodeModule,
    ClockModule,
    ConfigModule,
    PKCEModule,
    JwtModule,
  ],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
