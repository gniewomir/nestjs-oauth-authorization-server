import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";

import { ContextsDomainRepository } from "./Contexts.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseContext])],
  providers: [ContextsDomainRepository],
  exports: [ContextsDomainRepository],
})
export class ContextsDomainRepositoryModule {}
