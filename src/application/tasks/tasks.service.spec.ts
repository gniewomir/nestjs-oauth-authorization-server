import { Test, TestingModule } from "@nestjs/testing";

import { IdentityValue } from "@domain/IdentityValue";
import { ContextsInterfaceSymbol } from "@domain/tasks/context/Contexts.interface";
import { DescriptionInterfaceSymbol } from "@domain/tasks/Description.interface";
import { GoalsInterfaceSymbol } from "@domain/tasks/goal/Goals.interface";
import { TasksInterfaceSymbol } from "@domain/tasks/task/Tasks.interface";
import { ContextsDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Contexts";
import { GoalsDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Goals";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Tasks";
import { HtmlService } from "@infrastructure/security/html/html.service";

import { TasksService } from "./tasks.service";

describe("TasksService", () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksInterfaceSymbol,
          useClass: TasksDomainRepositoryInMemory,
        },
        {
          provide: GoalsInterfaceSymbol,
          useClass: GoalsDomainRepositoryInMemory,
        },
        {
          provide: ContextsInterfaceSymbol,
          useClass: ContextsDomainRepositoryInMemory,
        },
        {
          provide: DescriptionInterfaceSymbol,
          useClass: HtmlService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe("createTask", () => {
    it("should create a task with valid parameters", async () => {
      const request = {
        description: "Test task description",
        assignedUserId: IdentityValue.create().toString(),
        goalId: IdentityValue.create().toString(),
        contextId: IdentityValue.create().toString(),
      };

      const result = await service.createTask(request);

      expect(result).toBeDefined();
      expect(result.description).toBe(request.description);
      expect(result.assignedUserId).toBe(request.assignedUserId);
      expect(result.goalId).toBe(request.goalId);
      expect(result.contextId).toBe(request.contextId);
      expect(result.orderKey).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("should sanitize task description", async () => {
      const request = {
        description: "<script>alert('xss')</script>Test task",
        assignedUserId: IdentityValue.create().toString(),
        goalId: IdentityValue.create().toString(),
        contextId: IdentityValue.create().toString(),
      };

      const result = await service.createTask(request);

      expect(result.description).toBe("Test task");
    });

    it("should throw error for empty description", async () => {
      const request = {
        description: "",
        assignedUserId: IdentityValue.create().toString(),
        goalId: IdentityValue.create().toString(),
        contextId: IdentityValue.create().toString(),
      };

      await expect(service.createTask(request)).rejects.toThrow(
        "Description cannot be empty",
      );
    });

    it("should throw error for invalid user ID", async () => {
      const request = {
        description: "Test task",
        assignedUserId: "invalid-uuid",
        goalId: IdentityValue.create().toString(),
        contextId: IdentityValue.create().toString(),
      };

      await expect(service.createTask(request)).rejects.toThrow();
    });
  });

  describe("createGoal", () => {
    it("should create a goal with valid parameters", async () => {
      const request = {
        description: "Test goal description",
        assignedUserId: IdentityValue.create().toString(),
      };

      const result = await service.createGoal(request);

      expect(result).toBeDefined();
      expect(result.description).toBe(request.description);
      expect(result.assignedUserId).toBe(request.assignedUserId);
      expect(result.orderKey).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("should sanitize goal description", async () => {
      const request = {
        description: "<script>alert('xss')</script>Test goal",
        assignedUserId: IdentityValue.create().toString(),
      };

      const result = await service.createGoal(request);

      expect(result.description).toBe("Test goal");
    });

    it("should throw error for empty description", async () => {
      const request = {
        description: "",
        assignedUserId: IdentityValue.create().toString(),
      };

      await expect(service.createGoal(request)).rejects.toThrow(
        "Description cannot be empty",
      );
    });

    it("should throw error for invalid user ID", async () => {
      const request = {
        description: "Test goal",
        assignedUserId: "invalid-uuid",
      };

      await expect(service.createGoal(request)).rejects.toThrow();
    });
  });

  describe("createContext", () => {
    it("should create a context with valid parameters", async () => {
      const request = {
        description: "Test context description",
        assignedUserId: IdentityValue.create().toString(),
      };

      const result = await service.createContext(request);

      expect(result).toBeDefined();
      expect(result.description).toBe(request.description);
      expect(result.assignedUserId).toBe(request.assignedUserId);
      expect(result.orderKey).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("should sanitize context description", async () => {
      const request = {
        description: "<script>alert('xss')</script>Test context",
        assignedUserId: IdentityValue.create().toString(),
      };

      const result = await service.createContext(request);

      expect(result.description).toBe("Test context");
    });

    it("should throw error for empty description", async () => {
      const request = {
        description: "",
        assignedUserId: IdentityValue.create().toString(),
      };

      await expect(service.createContext(request)).rejects.toThrow(
        "Description cannot be empty",
      );
    });

    it("should throw error for invalid user ID", async () => {
      const request = {
        description: "Test context",
        assignedUserId: "invalid-uuid",
      };

      await expect(service.createContext(request)).rejects.toThrow();
    });
  });

  describe("integration", () => {
    it("should create goal, context, and task in sequence", async () => {
      const userId = IdentityValue.create().toString();

      // Create goal
      const goalRequest = {
        description: "Test goal",
        assignedUserId: userId,
      };
      const goal = await service.createGoal(goalRequest);

      // Create context
      const contextRequest = {
        description: "Test context",
        assignedUserId: userId,
      };
      const context = await service.createContext(contextRequest);

      // Create task
      const taskRequest = {
        description: "Test task",
        assignedUserId: userId,
        goalId: goal.id,
        contextId: context.id,
      };
      const task = await service.createTask(taskRequest);

      expect(task.goalId).toBe(goal.id);
      expect(task.contextId).toBe(context.id);
      expect(task.assignedUserId).toBe(userId);
    });

    it("should generate unique IDs for each entity", async () => {
      const userId = IdentityValue.create().toString();

      const goal1 = await service.createGoal({
        description: "Goal 1",
        assignedUserId: userId,
      });

      const goal2 = await service.createGoal({
        description: "Goal 2",
        assignedUserId: userId,
      });

      const context1 = await service.createContext({
        description: "Context 1",
        assignedUserId: userId,
      });

      const context2 = await service.createContext({
        description: "Context 2",
        assignedUserId: userId,
      });

      expect(goal1.id).not.toBe(goal2.id);
      expect(context1.id).not.toBe(context2.id);
    });
  });
});
