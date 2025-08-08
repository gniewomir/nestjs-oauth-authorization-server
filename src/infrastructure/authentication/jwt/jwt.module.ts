import { Module } from "@nestjs/common";
import { TokenPayloadInterfaceSymbol } from "@domain/authentication/Token/TokenPayload.interface";
import { JwtService } from "@infrastructure/authentication/jwt/jwt.service";

@Module({
  providers: [
    {
      provide: TokenPayloadInterfaceSymbol,
      useClass: JwtService,
    },
  ],
  exports: [TokenPayloadInterfaceSymbol],
})
export class JwtModule {}
