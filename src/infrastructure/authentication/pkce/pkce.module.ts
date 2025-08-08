import { Module } from "@nestjs/common";
import { PKCEService } from "@infrastructure/authentication/pkce/pkce.service";
import { PKCEInterfaceSymbol } from "@domain/authentication/PKCE/PKCE.interface";

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
