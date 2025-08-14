import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Task as DatabaseTask } from "@infrastructure/database/entities/task.entity";

import { TasksDomainRepository } from "./Tasks.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseTask])],
  providers: [TasksDomainRepository],
  exports: [TasksDomainRepository],
})
export class TasksDomainRepositoryModule {}
