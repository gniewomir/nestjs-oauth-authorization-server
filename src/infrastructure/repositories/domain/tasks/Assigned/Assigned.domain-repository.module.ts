import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AssignedInterfaceSymbol } from "@domain/tasks/assigned/Assigned.interface";
import { User } from "@infrastructure/database/entities/user.entity";

import { AssignedDomainRepository } from "./Assigned.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: AssignedInterfaceSymbol,
      useClass: AssignedDomainRepository,
    },
  ],
  exports: [AssignedInterfaceSymbol],
})
export class AssignedDomainRepositoryModule {}
