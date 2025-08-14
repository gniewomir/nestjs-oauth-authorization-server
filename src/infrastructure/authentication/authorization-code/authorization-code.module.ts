import { Module } from "@nestjs/common";
import { AuthorizationCodeService } from "./authorization-code.service";

@Module({
  providers: [AuthorizationCodeService],
  exports: [AuthorizationCodeService],
})
export class AuthorizationCodeModule {}
