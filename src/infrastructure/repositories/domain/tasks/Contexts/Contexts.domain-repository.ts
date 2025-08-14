import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IdentityValue } from "@domain/IdentityValue";
import { Context as DomainContext } from "@domain/tasks/context/Context";
import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";

@Injectable()
export class ContextsDomainRepository implements ContextsInterface {
  constructor(
    @InjectRepository(DatabaseContext)
    private readonly contextRepository: Repository<DatabaseContext>,
  ) {}

  async persist(context: DomainContext): Promise<void> {
    const databaseContext = this.mapToDatabase(context);
    await this.contextRepository.save(databaseContext);
  }

  async retrieve(identity: IdentityValue): Promise<DomainContext> {
    const context = await this.contextRepository.findOne({
      where: { id: identity.toString() },
    });
    if (!context) {
      throw new Error("Context not found");
    }

    return this.mapToDomain(context);
  }

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const context = await this.contextRepository.findOne({
      where: { id: identity.toString() },
      select: ["orderKey"],
    });

    if (!context) {
      throw new Error("Context not found");
    }

    return context.orderKey;
  }

  async searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const context = await this.contextRepository
      .createQueryBuilder("context")
      .select("context.orderKey")
      .where("context.userId = :userId", {
        userId: assignedIdentity.toString(),
      })
      .andWhere("context.orderKey < :orderKey", { orderKey })
      .orderBy("context.orderKey", "DESC")
      .limit(1)
      .getOne();

    return context?.orderKey || null;
  }

  async searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const context = await this.contextRepository
      .createQueryBuilder("context")
      .select("context.orderKey")
      .where("context.userId = :userId", {
        userId: assignedIdentity.toString(),
      })
      .orderBy("context.orderKey", "DESC")
      .limit(1)
      .getOne();

    return context?.orderKey || null;
  }

  async searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const context = await this.contextRepository
      .createQueryBuilder("context")
      .select("context.orderKey")
      .where("context.userId = :userId", {
        userId: assignedIdentity.toString(),
      })
      .andWhere("context.orderKey > :orderKey", { orderKey })
      .orderBy("context.orderKey", "ASC")
      .limit(1)
      .getOne();

    return context?.orderKey || null;
  }

  async searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const context = await this.contextRepository
      .createQueryBuilder("context")
      .select("context.orderKey")
      .where("context.userId = :userId", {
        userId: assignedIdentity.toString(),
      })
      .orderBy("context.orderKey", "ASC")
      .limit(1)
      .getOne();

    return context?.orderKey || null;
  }

  private mapToDomain(databaseContext: DatabaseContext): DomainContext {
    return new DomainContext({
      identity: IdentityValue.fromString(databaseContext.id),
      description: DescriptionValue.fromString(databaseContext.description),
      assigned: IdentityValue.fromString(databaseContext.userId),
      orderKey: databaseContext.orderKey,
    });
  }

  private mapToDatabase(
    domainContext: DomainContext,
  ): Omit<DatabaseContext, "createdAt" | "updatedAt" | "user" | "tasks"> {
    return {
      id: domainContext.identity.toString(),
      description: domainContext.description.toString(),
      orderKey: domainContext.orderKey,
      userId: domainContext.assigned.toString(),
    };
  }
}
