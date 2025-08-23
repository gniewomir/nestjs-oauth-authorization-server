import { Module } from "@nestjs/common";

import { ContextsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Contexts";
import { GoalsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Goals";
import { TasksDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Tasks";
import { HtmlModule } from "@infrastructure/security/html";

import { TasksService } from "./tasks.service";

@Module({
  imports: [
    TasksDomainRepositoryModule,
    GoalsDomainRepositoryModule,
    ContextsDomainRepositoryModule,
    HtmlModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
