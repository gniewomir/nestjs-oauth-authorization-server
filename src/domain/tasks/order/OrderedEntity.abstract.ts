import { IdentityValue } from "@domain/IdentityValue";
import { OrderInterface } from "@domain/tasks/order/Order.interface";
import { OrderService } from "@domain/tasks/order/Order.service";

export abstract class OrderedEntity<T extends OrderInterface> {
  protected _orderKey: string;
  public readonly assigned: IdentityValue;

  public constructor({ assigned }: { assigned: IdentityValue }) {
    this.assigned = assigned;
  }

  public get orderKey() {
    return this._orderKey;
  }

  public async moveBefore(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<T>,
  ): Promise<void> {
    this._orderKey = await orderingService.nextAvailableOrderKeyBefore(
      referenceEntityIdentity,
      this.assigned,
    );
  }

  public async moveAfter(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<T>,
  ): Promise<void> {
    this._orderKey = await orderingService.nextAvailableOrderKeyAfter(
      referenceEntityIdentity,
      this.assigned,
    );
  }
}
