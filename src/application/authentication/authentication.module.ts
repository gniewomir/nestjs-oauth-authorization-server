import { Module } from "@nestjs/common";

import { AuthenticationService } from "@application/authentication/authentication.service";
import { ClockModule } from "@infrastructure/clock";
import { ConfigModule } from "@infrastructure/config";
import { JwtModule } from "@infrastructure/security/jwt";

@Module({
  imports: [ClockModule, ConfigModule, JwtModule],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
