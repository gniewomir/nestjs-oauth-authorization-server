import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication";
import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { goalMother } from "@test/domain/tasks/Goal.mother";

import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal as DomainGoal } from "@domain/tasks/goal/Goal";
import { GoalsInterfaceSymbol } from "@domain/tasks/goal/Goals.interface";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities";
import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";
import { UserDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository";
import { UserDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.module";
import { GoalsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Goals/Goals.domain-repository.module";

import { GoalsDomainRepository } from "./Goals.domain-repository";

describe("GoalsDomainRepository", () => {
  let module: TestingModule;
  let repository: GoalsDomainRepository;
  let userDomainRepository: UserDomainRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        UserDomainRepositoryModule,
        GoalsDomainRepositoryModule,
        TypeOrmModule.forFeature([DatabaseGoal, DatabaseUser]),
      ],
      providers: [GoalsDomainRepository],
    }).compile();

    repository = module.get<GoalsDomainRepository>(GoalsInterfaceSymbol);
    userDomainRepository =
      module.get<UserDomainRepository>(UsersInterfaceSymbol);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("persist", () => {
    it("should save a new goal to database", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });

      await userDomainRepository.persist(user);

      // Act
      await repository.persist(goal);

      // Assert - verify goal was saved by retrieving it
      const savedGoal = await repository.retrieve(goal.identity);
      expect(savedGoal).toBeInstanceOf(DomainGoal);
      expect(savedGoal.identity.toString()).toBe(goal.identity.toString());
      expect(savedGoal.description.toString()).toBe(
        goal.description.toString(),
      );
      expect(savedGoal.orderKey).toBe(goal.orderKey);
      expect(savedGoal.assigned.toString()).toBe(goal.assigned.toString());
    });

    it("should update existing goal when persisting with same identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const originalGoal = goalMother({
        assigned: assigned.identity,
        description: DescriptionValue.fromString("original.description"),
      });

      await userDomainRepository.persist(user);
      await repository.persist(originalGoal);

      // Act - create updated goal with same identity
      const updatedGoal = new DomainGoal({
        identity: originalGoal.identity, // Same identity
        description: DescriptionValue.fromString("updated.description"),
        assigned: originalGoal.assigned,
        orderKey: originalGoal.orderKey,
      });
      await repository.persist(updatedGoal);

      // Assert
      const retrievedGoal = await repository.retrieve(originalGoal.identity);
      expect(retrievedGoal.description.toString()).toBe("updated.description");
      expect(retrievedGoal.identity.toString()).toBe(
        originalGoal.identity.toString(),
      );
      expect(retrievedGoal.assigned.toString()).toBe(
        originalGoal.assigned.toString(),
      );
      expect(retrievedGoal.orderKey).toBe(originalGoal.orderKey);
    });
  });

  describe("retrieve", () => {
    it("should return goal when found by identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({
        assigned: assigned.identity,
        description: DescriptionValue.fromString("retrieve.test.goal"),
      });

      await userDomainRepository.persist(user);
      await repository.persist(goal);

      // Act
      const result = await repository.retrieve(goal.identity);

      // Assert
      expect(result).toBeInstanceOf(DomainGoal);
      expect(result.identity.toString()).toBe(goal.identity.toString());
      expect(result.description.toString()).toBe(goal.description.toString());
      expect(result.orderKey).toBe(goal.orderKey);
      expect(result.assigned.toString()).toBe(goal.assigned.toString());
    });

    it("should throw error when goal not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Goal not found",
      );
    });
  });

  describe("getOrderKey", () => {
    it("should return order key when goal found by identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({
        assigned: assigned.identity,
        orderKey: "getOrderKey.test.key",
      });

      await userDomainRepository.persist(user);
      await repository.persist(goal);

      // Act
      const result = await repository.getOrderKey(goal.identity);

      // Assert
      expect(result).toBe("getOrderKey.test.key");
    });

    it("should throw error when goal not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.getOrderKey(nonExistentId)).rejects.toThrow(
        "Goal not found",
      );
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("should return highest order key for user", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });

      const goal1 = goalMother({
        assigned: assigned.identity,
        orderKey: "searchHighest.a",
      });
      const goal2 = goalMother({
        assigned: assigned.identity,
        orderKey: "searchHighest.z",
      });

      await userDomainRepository.persist(user);
      await repository.persist(goal1);
      await repository.persist(goal2);

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe("searchHighest.z");
    });

    it("should return null when no goals exist for user", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("should return lowest order key for user", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });

      const goal1 = goalMother({
        assigned: assigned.identity,
        orderKey: "searchLowest.a",
      });
      const goal2 = goalMother({
        assigned: assigned.identity,
        orderKey: "searchLowest.z",
      });

      await userDomainRepository.persist(user);
      await repository.persist(goal1);
      await repository.persist(goal2);

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe("searchLowest.a");
    });

    it("should return null when no goals exist for user", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
