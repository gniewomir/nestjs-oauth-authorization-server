import { Module } from "@nestjs/common";

import { PKCEInterfaceSymbol } from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import { PKCEService } from "@infrastructure/security/pkce/pkce.service";

@Module({
  providers: [
    {
      provide: PKCEInterfaceSymbol,
      useClass: PKCEService,
    },
  ],
  exports: [PKCEInterfaceSymbol],
})
export class PKCEModule {}
