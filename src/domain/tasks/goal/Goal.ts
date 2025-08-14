import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { OrderService } from "@domain/tasks/order";
import { OrderedEntity } from "@domain/tasks/order/OrderedEntity.abstract";

import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";

export type TGoalConstructorArgs = ConstructorParameters<typeof Goal>;
export type TGoalConstructorParam = TGoalConstructorArgs[0];

export class Goal extends OrderedEntity<GoalsInterface> {
  public readonly description: DescriptionValue;
  public readonly identity: IdentityValue;
  public readonly assigned: IdentityValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    orderKey: string;
    assigned: IdentityValue;
  }) {
    super({
      assigned: parameters.assigned,
    });

    this.identity = parameters.identity;
    this.assigned = parameters.assigned;
    this.description = parameters.description;
    this._orderKey = parameters.orderKey;
  }

  public static async create(
    parameters: Omit<TGoalConstructorParam, "orderKey">,
    goals: GoalsInterface,
  ): Promise<Goal> {
    return new Goal({
      ...parameters,
      orderKey:
        (await goals.searchForHighestOrderKey(parameters.identity)) ||
        OrderService.START_ORDER_KEY,
    });
  }
}
