import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal as DomainGoal } from "@domain/tasks/goal/Goal";
import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";

@Injectable()
export class GoalsDomainRepository implements GoalsInterface {
  constructor(
    @InjectRepository(DatabaseGoal)
    private readonly goalRepository: Repository<DatabaseGoal>,
  ) {}

  async persist(goal: DomainGoal): Promise<void> {
    const databaseGoal = this.mapToDatabase(goal);
    await this.goalRepository.save(databaseGoal);
  }

  async retrieve(identity: IdentityValue): Promise<DomainGoal> {
    const goal = await this.goalRepository.findOne({
      where: { id: identity.toString() },
    });
    if (!goal) {
      throw new Error("Goal not found");
    }

    return this.mapToDomain(goal);
  }

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const goal = await this.goalRepository.findOne({
      where: { id: identity.toString() },
      select: ["orderKey"],
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    return goal.orderKey;
  }

  async searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const goal = await this.goalRepository
      .createQueryBuilder("goal")
      .select("goal.orderKey")
      .where("goal.userId = :userId", { userId: assignedIdentity.toString() })
      .andWhere("goal.orderKey < :orderKey", { orderKey })
      .orderBy("goal.orderKey", "DESC")
      .limit(1)
      .getOne();

    return goal?.orderKey || null;
  }

  async searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const goal = await this.goalRepository
      .createQueryBuilder("goal")
      .select("goal.orderKey")
      .where("goal.userId = :userId", { userId: assignedIdentity.toString() })
      .orderBy("goal.orderKey", "DESC")
      .limit(1)
      .getOne();

    return goal?.orderKey || null;
  }

  async searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const goal = await this.goalRepository
      .createQueryBuilder("goal")
      .select("goal.orderKey")
      .where("goal.userId = :userId", { userId: assignedIdentity.toString() })
      .andWhere("goal.orderKey > :orderKey", { orderKey })
      .orderBy("goal.orderKey", "ASC")
      .limit(1)
      .getOne();

    return goal?.orderKey || null;
  }

  async searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const goal = await this.goalRepository
      .createQueryBuilder("goal")
      .select("goal.orderKey")
      .where("goal.userId = :userId", { userId: assignedIdentity.toString() })
      .orderBy("goal.orderKey", "ASC")
      .limit(1)
      .getOne();

    return goal?.orderKey || null;
  }

  private mapToDomain(databaseGoal: DatabaseGoal): DomainGoal {
    return new DomainGoal({
      identity: IdentityValue.fromString(databaseGoal.id),
      description: DescriptionValue.fromString(databaseGoal.description),
      assigned: IdentityValue.fromString(databaseGoal.userId),
      orderKey: databaseGoal.orderKey,
    });
  }

  private mapToDatabase(
    domainGoal: DomainGoal,
  ): Omit<DatabaseGoal, "createdAt" | "updatedAt" | "tasks" | "user"> {
    return {
      id: domainGoal.identity.toString(),
      description: domainGoal.description.toString(),
      orderKey: domainGoal.orderKey,
      userId: domainGoal.assigned.toString(),
    };
  }
}
