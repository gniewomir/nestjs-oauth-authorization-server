import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";
import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { OrderService } from "@domain/tasks/order";
import { OrderedEntity } from "@domain/tasks/order/OrderedEntity.abstract";

import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";

export type TContextConstructorArgs = ConstructorParameters<typeof Context>;
export type TContextConstructorParam = TContextConstructorArgs[0];

export class Context extends OrderedEntity<GoalsInterface> {
  public readonly description: DescriptionValue;
  public readonly identity: IdentityValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    orderKey: string;
  }) {
    super();

    this.identity = parameters.identity;
    this.description = parameters.description;
    this._orderKey = parameters.orderKey;
  }

  public static async create(
    parameters: Omit<TContextConstructorParam, "orderKey">,
    contexts: ContextsInterface,
  ): Promise<Context> {
    return new Context({
      ...parameters,
      orderKey:
        (await contexts.searchForHighestOrderKey()) ||
        OrderService.START_ORDER_KEY,
    });
  }
}
