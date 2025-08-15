import { Module } from "@nestjs/common";
import { JwtModule as NestJwtModule } from "@nestjs/jwt";

import { TokenPayloadInterfaceSymbol } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { ConfigModule } from "@infrastructure/config";
import { JwtService } from "@infrastructure/security/jwt/jwt.service";

@Module({
  imports: [NestJwtModule, ConfigModule],
  providers: [
    {
      provide: TokenPayloadInterfaceSymbol,
      useClass: JwtService,
    },
  ],
  exports: [TokenPayloadInterfaceSymbol],
})
export class JwtModule {}
