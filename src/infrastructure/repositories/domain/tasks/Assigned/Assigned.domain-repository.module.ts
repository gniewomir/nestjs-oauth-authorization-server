import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "@infrastructure/database/entities/user.entity";

import { AssignedDomainRepository } from "./Assigned.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AssignedDomainRepository],
  exports: [AssignedDomainRepository],
})
export class AssignedDomainRepositoryModule {}
