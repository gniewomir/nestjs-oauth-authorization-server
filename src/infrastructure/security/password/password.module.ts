import { Module } from "@nestjs/common";

import { PasswordInterfaceSymbol } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { ConfigModule } from "@infrastructure/config";
import { PasswordService } from "@infrastructure/security/password/password.service";

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
