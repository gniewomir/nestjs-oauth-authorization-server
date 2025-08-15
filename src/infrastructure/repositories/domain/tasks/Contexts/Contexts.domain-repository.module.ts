import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ContextsInterfaceSymbol } from "@domain/tasks/context/Contexts.interface";
import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";

import { ContextsDomainRepository } from "./Contexts.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseContext])],
  providers: [
    {
      provide: ContextsInterfaceSymbol,
      useClass: ContextsDomainRepository,
    },
  ],
  exports: [ContextsInterfaceSymbol],
})
export class ContextsDomainRepositoryModule {}
