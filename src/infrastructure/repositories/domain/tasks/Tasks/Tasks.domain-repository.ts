import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Task as DomainTask } from "@domain/tasks/task/Task";
import { TasksInterface } from "@domain/tasks/task/Tasks.interface";
import { Task as DatabaseTask } from "@infrastructure/database/entities/task.entity";

@Injectable()
export class TasksDomainRepository implements TasksInterface {
  constructor(
    @InjectRepository(DatabaseTask)
    private readonly taskRepository: Repository<DatabaseTask>,
  ) {}

  async persist(task: DomainTask): Promise<void> {
    const databaseTask = this.mapToDatabase(task);
    await this.taskRepository.save(databaseTask);
  }

  async retrieve(identity: IdentityValue): Promise<DomainTask> {
    const task = await this.taskRepository.findOne({
      where: { id: identity.toString() },
    });
    if (!task) {
      throw new Error("Task not found");
    }

    return this.mapToDomain(task);
  }

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const task = await this.taskRepository.findOne({
      where: { id: identity.toString() },
      select: ["orderKey"],
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return task.orderKey;
  }

  async searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const task = await this.taskRepository
      .createQueryBuilder("task")
      .select("task.orderKey")
      .where("task.userId = :userId", { userId: assignedIdentity.toString() })
      .andWhere("task.orderKey < :orderKey", { orderKey })
      .orderBy("task.orderKey", "DESC")
      .limit(1)
      .getOne();

    return task?.orderKey || null;
  }

  async searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const task = await this.taskRepository
      .createQueryBuilder("task")
      .select("task.orderKey")
      .where("task.userId = :userId", { userId: assignedIdentity.toString() })
      .orderBy("task.orderKey", "DESC")
      .limit(1)
      .getOne();

    return task?.orderKey || null;
  }

  async searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const task = await this.taskRepository
      .createQueryBuilder("task")
      .select("task.orderKey")
      .where("task.userId = :userId", { userId: assignedIdentity.toString() })
      .andWhere("task.orderKey > :orderKey", { orderKey })
      .orderBy("task.orderKey", "ASC")
      .limit(1)
      .getOne();

    return task?.orderKey || null;
  }

  async searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const task = await this.taskRepository
      .createQueryBuilder("task")
      .select("task.orderKey")
      .where("task.userId = :userId", { userId: assignedIdentity.toString() })
      .orderBy("task.orderKey", "ASC")
      .limit(1)
      .getOne();

    return task?.orderKey || null;
  }

  private mapToDomain(databaseTask: DatabaseTask): DomainTask {
    return new DomainTask({
      identity: IdentityValue.fromString(databaseTask.id),
      description: DescriptionValue.fromString(databaseTask.description),
      assigned: IdentityValue.fromString(databaseTask.userId),
      goal: IdentityValue.fromString(databaseTask.goalId),
      context: IdentityValue.fromString(databaseTask.contextId),
      orderKey: databaseTask.orderKey,
    });
  }

  private mapToDatabase(
    domainTask: DomainTask,
  ): Omit<
    DatabaseTask,
    "createdAt" | "updatedAt" | "goal" | "context" | "user"
  > {
    return {
      id: domainTask.identity.toString(),
      description: domainTask.description.toString(),
      orderKey: domainTask.orderKey,
      goalId: domainTask.goal.toString(),
      contextId: domainTask.context.toString(),
      userId: domainTask.assigned.toString(),
    };
  }
}
