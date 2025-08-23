import { Inject, Injectable } from "@nestjs/common";

import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";
import {
  ContextsInterface,
  ContextsInterfaceSymbol,
} from "@domain/tasks/context/Contexts.interface";
import {
  DescriptionInterface,
  DescriptionInterfaceSymbol,
} from "@domain/tasks/Description.interface";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal } from "@domain/tasks/goal/Goal";
import {
  GoalsInterface,
  GoalsInterfaceSymbol,
} from "@domain/tasks/goal/Goals.interface";
import { Task } from "@domain/tasks/task/Task";
import {
  TasksInterface,
  TasksInterfaceSymbol,
} from "@domain/tasks/task/Tasks.interface";

export interface CreateTaskRequest {
  description: string;
  assignedUserId: string;
  goalId: string;
  contextId: string;
}

export interface CreateGoalRequest {
  description: string;
  assignedUserId: string;
}

export interface CreateContextRequest {
  description: string;
  assignedUserId: string;
}

export interface CreateTaskResponse {
  id: string;
  description: string;
  assignedUserId: string;
  goalId: string;
  contextId: string;
  orderKey: string;
}

export interface CreateGoalResponse {
  id: string;
  description: string;
  assignedUserId: string;
  orderKey: string;
}

export interface CreateContextResponse {
  id: string;
  description: string;
  assignedUserId: string;
  orderKey: string;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksInterfaceSymbol)
    private readonly tasksRepository: TasksInterface,
    @Inject(GoalsInterfaceSymbol)
    private readonly goalsRepository: GoalsInterface,
    @Inject(ContextsInterfaceSymbol)
    private readonly contextsRepository: ContextsInterface,
    @Inject(DescriptionInterfaceSymbol)
    private readonly htmlSanitizer: DescriptionInterface,
  ) {}

  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const task = await Task.create(
      {
        identity: IdentityValue.create(),
        description: DescriptionValue.fromInsecureSource(
          request.description,
          this.htmlSanitizer,
        ),
        assigned: IdentityValue.fromString(request.assignedUserId),
        goal: IdentityValue.fromString(request.goalId),
        context: IdentityValue.fromString(request.contextId),
      },
      this.tasksRepository,
    );

    await this.tasksRepository.persist(task);

    return {
      id: task.identity.toString(),
      description: task.description.toString(),
      assignedUserId: task.assigned.toString(),
      goalId: task.goal.toString(),
      contextId: task.context.toString(),
      orderKey: task.orderKey,
    };
  }

  async createGoal(request: CreateGoalRequest): Promise<CreateGoalResponse> {
    const goal = await Goal.create(
      {
        identity: IdentityValue.create(),
        description: DescriptionValue.fromInsecureSource(
          request.description,
          this.htmlSanitizer,
        ),
        assigned: IdentityValue.fromString(request.assignedUserId),
      },
      this.goalsRepository,
    );

    await this.goalsRepository.persist(goal);

    return {
      id: goal.identity.toString(),
      description: goal.description.toString(),
      assignedUserId: goal.assigned.toString(),
      orderKey: goal.orderKey,
    };
  }

  async createContext(
    request: CreateContextRequest,
  ): Promise<CreateContextResponse> {
    const context = await Context.create(
      {
        identity: IdentityValue.create(),
        description: DescriptionValue.fromInsecureSource(
          request.description,
          this.htmlSanitizer,
        ),
        assigned: IdentityValue.fromString(request.assignedUserId),
      },
      this.contextsRepository,
    );

    await this.contextsRepository.persist(context);

    return {
      id: context.identity.toString(),
      description: context.description.toString(),
      assignedUserId: context.assigned.toString(),
      orderKey: context.orderKey,
    };
  }
}
