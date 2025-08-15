import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GoalsInterfaceSymbol } from "@domain/tasks/goal/Goals.interface";
import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";

import { GoalsDomainRepository } from "./Goals.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseGoal])],
  providers: [
    {
      provide: GoalsInterfaceSymbol,
      useClass: GoalsDomainRepository,
    },
  ],
  exports: [GoalsInterfaceSymbol],
})
export class GoalsDomainRepositoryModule {}
