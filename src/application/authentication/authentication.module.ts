import { Module } from "@nestjs/common";

import { AuthenticationService } from "@application/authentication/authentication.service";

@Module({
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
