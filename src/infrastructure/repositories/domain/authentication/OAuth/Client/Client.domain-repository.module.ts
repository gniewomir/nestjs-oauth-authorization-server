import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ClientInterfaceSymbol } from "@domain/auth/OAuth/Client/Client.interface";
import { OauthClient } from "@infrastructure/database/entities/oauth-client.entity";

import { ClientDomainRepository } from "./Client.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([OauthClient])],
  providers: [
    {
      provide: ClientInterfaceSymbol,
      useClass: ClientDomainRepository,
    },
  ],
  exports: [ClientInterfaceSymbol],
})
export class ClientDomainRepositoryModule {}
