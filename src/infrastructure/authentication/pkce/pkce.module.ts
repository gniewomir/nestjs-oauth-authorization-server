import { Module } from "@nestjs/common";

import { PKCEInterfaceSymbol } from "@domain/authentication/OAuth/Authorization/PKCE.interface";
import { PKCEService } from "@infrastructure/authentication/pkce/pkce.service";

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
