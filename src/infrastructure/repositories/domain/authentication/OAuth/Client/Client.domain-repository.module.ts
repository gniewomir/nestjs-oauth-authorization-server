import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OauthClient } from "@infrastructure/database/entities/oauth-client.entity";

import { ClientDomainRepository } from "./Client.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([OauthClient])],
  providers: [ClientDomainRepository],
  exports: [ClientDomainRepository],
})
export class ClientDomainRepositoryModule {}
