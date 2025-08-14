import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication";
import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { contextMother } from "@test/domain/tasks/Context.mother";
import { goalMother } from "@test/domain/tasks/Goal.mother";
import { taskMother } from "@test/domain/tasks/Task.mother";
import { Repository } from "typeorm";

import { User } from "@domain/authentication/OAuth/User/User";
import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal } from "@domain/tasks/goal/Goal";
import { Task as DomainTask } from "@domain/tasks/task/Task";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities";
import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";
import { Goal as DatabaseGoal } from "@infrastructure/database/entities/goal.entity";
import { Task as DatabaseTask } from "@infrastructure/database/entities/task.entity";

import { TasksDomainRepository } from "./Tasks.domain-repository";

describe("TasksDomainRepository", () => {
  let repository: TasksDomainRepository;
  let module: TestingModule;
  let userRepository: Repository<DatabaseUser>;
  let goalRepository: Repository<DatabaseGoal>;
  let contextRepository: Repository<DatabaseContext>;

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
      ],
      providers: [TasksDomainRepository],
    }).compile();

    repository = module.get<TasksDomainRepository>(TasksDomainRepository);
    userRepository = module.get<Repository<DatabaseUser>>(
      getRepositoryToken(DatabaseUser),
    );
    goalRepository = module.get<Repository<DatabaseGoal>>(
      getRepositoryToken(DatabaseGoal),
    );
    contextRepository = module.get<Repository<DatabaseContext>>(
      getRepositoryToken(DatabaseContext),
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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("Test task persistence"),
      });

      // First persist the related entities (Goal, Context and User(Assigned))
      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);

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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const originalTask = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("Original description"),
        orderKey: "A",
      });

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
      await repository.persist(originalTask);

      // Act - create updated task with same identity
      const updatedTask = new DomainTask({
        identity: originalTask.identity, // Same identity
        goal: originalTask.goal,
        context: originalTask.context,
        assigned: originalTask.assigned,
        description: DescriptionValue.fromString("Updated description"),
        orderKey: "B", // Changed order key
      });
      await repository.persist(updatedTask);

      // Assert
      const retrievedTask = await repository.retrieve(originalTask.identity);
      expect(retrievedTask.description.toString()).toBe("Updated description");
      expect(retrievedTask.orderKey).toBe("B");
    });
  });

  describe("retrieve", () => {
    it("should retrieve task by identity with all related entities", async () => {
      // Arrange
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        description: DescriptionValue.fromString("Retrieve test task"),
      });

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
      await repository.persist(task);

      // Act
      const result = await repository.retrieve(task.identity);

      // Assert
      expect(result).toBeInstanceOf(DomainTask);
      expect(result.identity.toString()).toBe(task.identity.toString());
      expect(result.description.toString()).toBe(task.description.toString());
      expect(result.assigned.toString()).toBe(task.assigned.toString());
      expect(result.orderKey).toBe(task.orderKey);

      // Verify related entities are properly mapped
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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const orderKey = "TEST_ORDER_KEY";
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        orderKey,
        assigned: assigned.identity,
      });

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const orderKey = "A"; // Lowest possible
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        orderKey,
      });

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const lowerKey = "A";
      const middleKey = "M";
      const higherKey = "Z";

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);

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
      const goal1 = goalMother();
      const context1 = contextMother();
      const goal2 = goalMother();
      const context2 = contextMother();
      const assigned1 = assignedMother();
      const user1 = userMother({ identity: assigned1.identity });
      const assigned2 = assignedMother();
      const user2 = userMother({ identity: assigned2.identity });

      await persistUserDirectly(user1);
      await persistUserDirectly(user2);
      await persistGoalDirectly(goal1);
      await persistContextDirectly(context1);
      await persistGoalDirectly(goal2);
      await persistContextDirectly(context2);

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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const orderKey = "Z"; // Highest possible
      const task = taskMother({
        goal: goal.identity,
        context: context.identity,
        assigned: assigned.identity,
        orderKey,
      });

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);
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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const lowerKey = "A";
      const middleKey = "M";
      const higherKey = "Z";

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);

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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const lowerKey = "A";
      const middleKey = "M";
      const highestKey = "Z";

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);

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
      const goal1 = goalMother();
      const context1 = contextMother();
      const goal2 = goalMother();
      const context2 = contextMother();
      const assigned1 = assignedMother();
      const user1 = userMother({ identity: assigned1.identity });
      const assigned2 = assignedMother();
      const user2 = userMother({ identity: assigned2.identity });

      await persistUserDirectly(user1);
      await persistUserDirectly(user2);
      await persistGoalDirectly(goal1);
      await persistContextDirectly(context1);
      await persistGoalDirectly(goal2);
      await persistContextDirectly(context2);

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
      const goal = goalMother();
      const context = contextMother();
      const assigned = assignedMother();
      const user = userMother({ identity: assigned.identity });
      const lowestKey = "A";
      const middleKey = "M";
      const higherKey = "Z";

      await persistUserDirectly(user);
      await persistGoalDirectly(goal);
      await persistContextDirectly(context);

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
      const goal1 = goalMother();
      const context1 = contextMother();
      const goal2 = goalMother();
      const context2 = contextMother();
      const assigned1 = assignedMother();
      const user1 = userMother({ identity: assigned1.identity });
      const assigned2 = assignedMother();
      const user2 = userMother({ identity: assigned2.identity });

      await persistUserDirectly(user1);
      await persistUserDirectly(user2);
      await persistGoalDirectly(goal1);
      await persistContextDirectly(context1);
      await persistGoalDirectly(goal2);
      await persistContextDirectly(context2);

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

  // Helper functions to persist related entities directly
  async function persistGoalDirectly(goal: Goal) {
    await goalRepository.save({
      id: goal.identity.toString(),
      description: goal.description.toString(),
      orderKey: goal.orderKey,
      userId: goal.assigned.toString(),
    });
  }

  async function persistContextDirectly(context: Context) {
    await contextRepository.save({
      id: context.identity.toString(),
      description: context.description.toString(),
      orderKey: context.orderKey,
      userId: context.assigned.toString(),
    });
  }

  async function persistUserDirectly(user: User) {
    await userRepository.save({
      id: user.identity.toString(),
      email: user.email.toString(),
      password: user.password,
      refreshTokens: user.refreshTokens,
      emailVerified: user.emailVerified,
    });
  }
});
