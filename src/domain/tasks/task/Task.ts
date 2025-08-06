import { Goal } from "../goal/Goal";
import { Context } from "../context/Context";
import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";
import { Assigned } from "../assigned/Assigned";
import { OrderService } from "@domain/tasks/order/Order.service";
import { TasksInterface } from "@domain/tasks/task/Tasks.interface";

export type TTaskConstructorArgs = ConstructorParameters<typeof Task>;
export type TTaskConstructorParam = TTaskConstructorArgs[0];

export class Task {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;
  public readonly assigned: Assigned;
  public readonly goal: Goal;
  public readonly context: Context;
  private _ordinalNumber: number;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: Assigned;
    goal: Goal;
    context: Context;
    ordinalNumber: number;
  }) {
    this.identity = parameters.identity;
    this.description = parameters.description;
    this.assigned = parameters.assigned;
    this.goal = parameters.goal;
    this.context = parameters.context;
    this._ordinalNumber = parameters.ordinalNumber;
  }

  public get ordinalNumber() {
    return this._ordinalNumber;
  }

  public async moveBefore(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<TasksInterface>,
  ): Promise<void> {
    this._ordinalNumber = await orderingService.nextAvailableOrdinalNumber(
      referenceEntityIdentity,
    );
  }
}
