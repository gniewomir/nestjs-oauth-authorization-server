import { Module } from "@nestjs/common";

import { PasswordInterfaceSymbol } from "@domain/authentication/OAuth/User/Credentials/Password.interface";
import { PasswordService } from "@infrastructure/authentication/password/password.service";
import { ConfigModule } from "@infrastructure/config";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PasswordInterfaceSymbol,
      useClass: PasswordService,
    },
  ],
  exports: [PasswordInterfaceSymbol],
})
export class PasswordModule {}
