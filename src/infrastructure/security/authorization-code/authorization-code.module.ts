import { Module } from "@nestjs/common";

import { CodeInterfaceSymbol } from "@domain/auth/OAuth/Authorization/Code/Code.interface";

import { AuthorizationCodeService } from "./authorization-code.service";

@Module({
  providers: [
    {
      provide: CodeInterfaceSymbol,
      useClass: AuthorizationCodeService,
    },
  ],
  exports: [CodeInterfaceSymbol],
})
export class AuthorizationCodeModule {}
