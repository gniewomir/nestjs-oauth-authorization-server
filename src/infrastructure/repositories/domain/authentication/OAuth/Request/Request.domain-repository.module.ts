import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RequestInterfaceSymbol } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { AuthorizationRequest } from "@infrastructure/database/entities/authorization-request.entity";

import { RequestDomainRepository } from "./Request.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizationRequest])],
  providers: [
    {
      provide: RequestInterfaceSymbol,
      useClass: RequestDomainRepository,
    },
  ],
  exports: [RequestInterfaceSymbol],
})
export class RequestDomainRepositoryModule {}
