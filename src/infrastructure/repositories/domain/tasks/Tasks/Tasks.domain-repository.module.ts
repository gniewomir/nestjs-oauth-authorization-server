import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TasksInterfaceSymbol } from "@domain/tasks/task/Tasks.interface";
import { Task as DatabaseTask } from "@infrastructure/database/entities/task.entity";

import { TasksDomainRepository } from "./Tasks.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseTask])],
  providers: [
    {
      provide: TasksInterfaceSymbol,
      useClass: TasksDomainRepository,
    },
  ],
  exports: [TasksInterfaceSymbol],
})
export class TasksDomainRepositoryModule {}
