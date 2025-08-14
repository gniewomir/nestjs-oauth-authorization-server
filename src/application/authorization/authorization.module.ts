import { Module } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";
import { RequestDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository.module";
import { ClientDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository.module";
import { UserDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.module";
import { PasswordModule } from "@infrastructure/authentication/password";
import { ClockModule } from "@infrastructure/clock";
import { ConfigModule } from "@infrastructure/config";
import { PKCEModule } from "@infrastructure/authentication/pkce";
import { JwtModule } from "@infrastructure/authentication/jwt";
import { AuthorizationCodeModule } from "@infrastructure/authentication/authorization-code/authorization-code.module";

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
