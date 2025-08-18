import { Module } from "@nestjs/common";

import { ContextsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Contexts";
import { GoalsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Goals";
import { TasksDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Tasks";
import { SanitizerModule } from "@infrastructure/security/sanitizer";

import { TasksService } from "./tasks.service";

@Module({
  imports: [
    TasksDomainRepositoryModule,
    GoalsDomainRepositoryModule,
    ContextsDomainRepositoryModule,
    SanitizerModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
