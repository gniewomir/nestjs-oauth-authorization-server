import { Module } from "@nestjs/common";
import { ConfigModule } from "@infrastructure/config";
import { PasswordService } from "@infrastructure/authentication/password/password.service";
import { PasswordInterfaceSymbol } from "@domain/authentication/Credentials/Password.interface";

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
