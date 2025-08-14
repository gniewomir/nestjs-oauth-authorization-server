import { OrderService } from "@domain/tasks/order";
import { OrderedEntity } from "@domain/tasks/order/OrderedEntity.abstract";
import { TasksInterface } from "@domain/tasks/task/Tasks.interface";

import { IdentityValue } from "../../IdentityValue";
import { Context } from "../context/Context";
import { DescriptionValue } from "../DescriptionValue";
import { Goal } from "../goal/Goal";

export type TTaskConstructorArgs = ConstructorParameters<typeof Task>;
export type TTaskConstructorParam = TTaskConstructorArgs[0];

export class Task extends OrderedEntity<TasksInterface> {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;
  public readonly goal: Goal;
  public readonly context: Context;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: IdentityValue;
    goal: Goal;
    context: Context;
    orderKey: string;
  }) {
    super({
      assigned: parameters.assigned,
    });

    this.identity = parameters.identity;
    this.description = parameters.description;
    this.goal = parameters.goal;
    this.context = parameters.context;
    this._orderKey = parameters.orderKey;
  }

  public static async create(
    parameters: Omit<TTaskConstructorParam, "orderKey">,
    tasks: TasksInterface,
  ): Promise<Task> {
    return new Task({
      ...parameters,
      orderKey:
        (await tasks.searchForHighestOrderKey(parameters.assigned)) ||
        OrderService.START_ORDER_KEY,
    });
  }
}
