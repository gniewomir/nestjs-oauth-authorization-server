import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";
import { OrderService } from "@domain/tasks/order";
import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";

export type TGoalConstructorArgs = ConstructorParameters<typeof Goal>;
export type TGoalConstructorParam = TGoalConstructorArgs[0];

export class Goal {
  public readonly description: DescriptionValue;
  public readonly identity: IdentityValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    ordinalNumber: number;
  }) {
    this.identity = parameters.identity;
    this.description = parameters.description;
    this._ordinalNumber = parameters.ordinalNumber;
  }

  private _ordinalNumber: number;

  public get ordinalNumber(): number {
    return this._ordinalNumber;
  }

  public async moveBefore(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<GoalsInterface>,
  ): Promise<void> {
    this._ordinalNumber = await orderingService.nextAvailableOrdinalNumber(
      referenceEntityIdentity,
    );
  }
}
