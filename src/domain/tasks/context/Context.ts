import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";
import { OrderService } from "@domain/tasks/order";
import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";

export type TContextConstructorArgs = ConstructorParameters<typeof Context>;
export type TContextConstructorParam = TContextConstructorArgs[0];

export class Context {
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
    orderingService: OrderService<ContextsInterface>,
  ): Promise<void> {
    this._ordinalNumber = await orderingService.nextAvailableOrdinalNumber(
      referenceEntityIdentity,
    );
  }
}
