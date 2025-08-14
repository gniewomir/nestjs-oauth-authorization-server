import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";

import { GoalsDomainRepository } from "./Goals.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseGoal])],
  providers: [GoalsDomainRepository],
  exports: [GoalsDomainRepository],
})
export class GoalsDomainRepositoryModule {}
