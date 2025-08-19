import { Module } from "@nestjs/common";

import { AuthenticationMiddleware } from "@application/authentication/authentication.middleware";
import { AuthenticationService } from "@application/authentication/authentication.service";
import { ClockModule } from "@infrastructure/clock";
import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";
import { JwtModule } from "@infrastructure/security/jwt";

@Module({
  imports: [ClockModule, ConfigModule, JwtModule, LoggerModule],
  providers: [AuthenticationService, AuthenticationMiddleware],
  exports: [AuthenticationService, AuthenticationMiddleware],
})
export class AuthenticationModule {}
