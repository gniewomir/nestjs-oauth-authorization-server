import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorizationRequest } from "@infrastructure/database/entities/authorization-request.entity";
import { RequestDomainRepository } from "./Request.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizationRequest])],
  providers: [RequestDomainRepository],
  exports: [RequestDomainRepository],
})
export class RequestDomainRepositoryModule {}
