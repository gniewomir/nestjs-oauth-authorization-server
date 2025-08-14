import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication";
import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { contextMother } from "@test/domain/tasks/Context.mother";
import { goalMother } from "@test/domain/tasks/Goal.mother";
import { taskMother } from "@test/domain/tasks/Task.mother";

import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Task as DomainTask } from "@domain/tasks/task/Task";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities";
import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";
import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";
import { Task as DatabaseTask } from "@infrastructure/database/entities/task.entity";
import { UserDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository";
import { UserDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.module";
import { ContextsDomainRepository } from "@infrastructure/repositories/domain/tasks/Contexts/Contexts.domain-repository";
import { ContextsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Contexts/Contexts.domain-repository.module";
import { GoalsDomainRepository } from "@infrastructure/repositories/domain/tasks/Goals/Goals.domain-repository";
import { GoalsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Goals/Goals.domain-repository.module";

import { TasksDomainRepository } from "./Tasks.domain-repository";

describe("TasksDomainRepository", () => {
  let repository: TasksDomainRepository;
  let module: TestingModule;
  let userDomainRepository: UserDomainRepository;
  let goalsDomainRepository: GoalsDomainRepository;
  let contextsDomainRepository: ContextsDomainRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([
          DatabaseTask,
          DatabaseGoal,
          DatabaseContext,
          DatabaseUser,
        ]),
        UserDomainRepositoryModule,
        GoalsDomainRepositoryModule,
        ContextsDomainRepositoryModule,
      ],
      providers: [
        TasksDomainRepository,
        UserDomainRepository,
        GoalsDomainRepository,
        ContextsDomainRepository,
      ],
    }).compile();

    repository = module.get<TasksDomainRepository>(TasksDomainRepository);
    userDomainRepository =
      module.get<UserDomainRepository>(UserDomainRepository);
    goalsDomainRepository = module.get<GoalsDomainRepository>(
      GoalsDomainRepository,
    );
    contextsDomainRepository = module.get<ContextsDomainRepository>(
      ContextsDomainRepository,
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("persist", () => {
    it("should save a new task to database", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("persist.test.task"),
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);

      // Act
      await repository.persist(task);

      // Assert - verify task was saved by retrieving it
      const savedTask = await repository.retrieve(task.identity);
      expect(savedTask).toBeInstanceOf(DomainTask);
      expect(savedTask.identity.toString()).toBe(task.identity.toString());
      expect(savedTask.description.toString()).toBe(
        task.description.toString(),
      );
      expect(savedTask.assigned.toString()).toBe(task.assigned.toString());
      expect(savedTask.goal.toString()).toBe(task.goal.toString());
      expect(savedTask.context.toString()).toBe(task.context.toString());
      expect(savedTask.orderKey).toBe(task.orderKey);
    });

    it("should update existing task when persisting with same identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const originalTask = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("original.description"),
        orderKey: "A",
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);
      await repository.persist(originalTask);

      // Act - create updated task with same identity
      const updatedTask = new DomainTask({
        identity: originalTask.identity, // Same identity
        goal: originalTask.goal,
        context: originalTask.context,
        assigned: originalTask.assigned,
        description: DescriptionValue.fromString("updated.description"),
        orderKey: "B", // Changed order key
      });
      await repository.persist(updatedTask);

      // Assert
      const retrievedTask = await repository.retrieve(originalTask.identity);
      expect(retrievedTask.description.toString()).toBe("updated.description");
      expect(retrievedTask.orderKey).toBe("B");
      expect(retrievedTask.identity.toString()).toBe(
        originalTask.identity.toString(),
      );
      expect(retrievedTask.assigned.toString()).toBe(
        originalTask.assigned.toString(),
      );
      expect(retrievedTask.goal.toString()).toBe(originalTask.goal.toString());
      expect(retrievedTask.context.toString()).toBe(
        originalTask.context.toString(),
      );
    });
  });

  describe("retrieve", () => {
    it("should retrieve task by identity with all related entities", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("retrieve.test.task"),
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);
      await repository.persist(task);

      // Act
      const result = await repository.retrieve(task.identity);

      // Assert
      expect(result).toBeInstanceOf(DomainTask);
      expect(result.identity.toString()).toBe(task.identity.toString());
      expect(result.description.toString()).toBe(task.description.toString());
      expect(result.assigned.toString()).toBe(task.assigned.toString());
      expect(result.orderKey).toBe(task.orderKey);
      expect(result.goal.toString()).toBe(goal.identity.toString());
      expect(result.context.toString()).toBe(context.identity.toString());
    });

    it("should throw error when task not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("getOrderKey", () => {
    it("should return order key for existing task", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const orderKey = "getOrderKey.test.key";
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        orderKey,
        assigned: assigned.identity,
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);
      await repository.persist(task);

      // Act
      const result = await repository.getOrderKey(task.identity);

      // Assert
      expect(result).toBe(orderKey);
    });

    it("should throw error when task not found", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.getOrderKey(nonExistentId)).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("should return null when no tasks exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        "M",
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return null when no lower order key exists", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const orderKey = "A"; // Lowest possible
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        orderKey,
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);
      await repository.persist(task);

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        orderKey,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return highest lower order key", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const lowerKey = "searchLower.a";
      const middleKey = "searchLower.m";
      const higherKey = "searchLower.z";

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);

      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        higherKey,
      );

      // Assert
      expect(result).toBe(middleKey);
    });

    it("should only consider tasks for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const goal1 = goalMother({ assigned: assigned1.identity });
      const context1 = contextMother({ assigned: assigned1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });
      const goal2 = goalMother({ assigned: assigned2.identity });
      const context2 = contextMother({ assigned: assigned2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);
      await goalsDomainRepository.persist(goal1);
      await contextsDomainRepository.persist(context1);
      await goalsDomainRepository.persist(goal2);
      await contextsDomainRepository.persist(context2);

      await repository.persist(
        taskMother({
          goal: goal1.identity,
          context: context1.identity,
          assigned: assigned1.identity,
          orderKey: "A",
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal2.identity,
          context: context2.identity,
          assigned: assigned2.identity,
          orderKey: "M",
        }),
      );

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned1.identity,
        "Z",
      );

      // Assert - should only find task from assigned1, not assigned2
      expect(result).toBe("A");
    });
  });

  describe("searchForHigherOrderKey", () => {
    it("should return null when no tasks exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        "M",
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return null when no higher order key exists", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const orderKey = "Z"; // Highest possible
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        orderKey,
      });

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);
      await repository.persist(task);

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        orderKey,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return lowest higher order key", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const lowerKey = "searchHigher.a";
      const middleKey = "searchHigher.m";
      const higherKey = "searchHigher.z";

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);

      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        lowerKey,
      );

      // Assert
      expect(result).toBe(middleKey);
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("should return null when no tasks exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return highest order key for assigned identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const lowerKey = "searchHighest.a";
      const middleKey = "searchHighest.m";
      const highestKey = "searchHighest.z";

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);

      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: highestKey,
        }),
      );

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(highestKey);
    });

    it("should only consider tasks for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const goal1 = goalMother({ assigned: assigned1.identity });
      const context1 = contextMother({ assigned: assigned1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });
      const goal2 = goalMother({ assigned: assigned2.identity });
      const context2 = contextMother({ assigned: assigned2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);
      await goalsDomainRepository.persist(goal1);
      await contextsDomainRepository.persist(context1);
      await goalsDomainRepository.persist(goal2);
      await contextsDomainRepository.persist(context2);

      await repository.persist(
        taskMother({
          goal: goal1.identity,
          context: context1.identity,
          assigned: assigned1.identity,
          orderKey: "M",
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal2.identity,
          context: context2.identity,
          assigned: assigned2.identity,
          orderKey: "Z",
        }),
      );

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned1.identity,
      );

      // Assert - should only find task from assigned1, not assigned2
      expect(result).toBe("M");
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("should return null when no tasks exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return lowest order key for assigned identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const goal = goalMother({ assigned: assigned.identity });
      const context = contextMother({ assigned: assigned.identity });
      const lowestKey = "searchLowest.a";
      const middleKey = "searchLowest.m";
      const higherKey = "searchLowest.z";

      await userDomainRepository.persist(user);
      await goalsDomainRepository.persist(goal);
      await contextsDomainRepository.persist(context);

      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal.identity,
          context: context.identity,
          assigned: assigned.identity,
          orderKey: lowestKey,
        }),
      );

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(lowestKey);
    });

    it("should only consider tasks for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const goal1 = goalMother({ assigned: assigned1.identity });
      const context1 = contextMother({ assigned: assigned1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });
      const goal2 = goalMother({ assigned: assigned2.identity });
      const context2 = contextMother({ assigned: assigned2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);
      await goalsDomainRepository.persist(goal1);
      await contextsDomainRepository.persist(context1);
      await goalsDomainRepository.persist(goal2);
      await contextsDomainRepository.persist(context2);

      await repository.persist(
        taskMother({
          goal: goal1.identity,
          context: context1.identity,
          assigned: assigned1.identity,
          orderKey: "M",
        }),
      );
      await repository.persist(
        taskMother({
          goal: goal2.identity,
          context: context2.identity,
          assigned: assigned2.identity,
          orderKey: "A",
        }),
      );

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned1.identity,
      );

      // Assert - should only find task from assigned1, not assigned2
      expect(result).toBe("M");
    });
  });
});
