import { Module } from "@nestjs/common";
import { JwtModule as NestJwtModule } from "@nestjs/jwt";

import { TokenPayloadInterfaceSymbol } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { JwtService } from "@infrastructure/authentication/jwt/jwt.service";
import { ConfigModule } from "@infrastructure/config";

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
