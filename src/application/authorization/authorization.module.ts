import { Module } from "@nestjs/common";

import { ClockModule } from "@infrastructure/clock";
import { ConfigModule } from "@infrastructure/config";
import {
  ClientDomainRepositoryModule,
  RequestDomainRepositoryModule,
  UserDomainRepositoryModule,
} from "@infrastructure/repositories/domain/authentication/OAuth";
import { AuthorizationCodeModule } from "@infrastructure/security/authorization-code";
import { EmailSanitizerModule } from "@infrastructure/security/email";
import { JwtModule } from "@infrastructure/security/jwt";
import { PasswordModule } from "@infrastructure/security/password";
import { PKCEModule } from "@infrastructure/security/pkce";

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
    EmailSanitizerModule,
  ],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
