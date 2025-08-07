import { OrderingConfig } from "@infrastructure/config/configs/ordering.config";
import { IdentityValue } from "@domain/IdentityValue";
import { OrderInterface } from "@domain/tasks/order/Order.interface";

export class OrderService<T extends OrderInterface> {
  constructor(
    private readonly orderingConfig: OrderingConfig,
    private readonly entities: T,
  ) {}

  public async newOrdinalNumber(): Promise<number> {
    const lowestOrdinalNumber =
      await this.entities.searchForLowestOrdinalNumber();
    return lowestOrdinalNumber === null
      ? this.orderingConfig.maxOrdinalNumber
      : lowestOrdinalNumber - this.orderingConfig.ordinalNumbersSpacing;
  }

  public async nextAvailableOrdinalNumber(
    taskIdentity: IdentityValue,
  ): Promise<number> {
    const taskOrdinalNumber =
      await this.entities.getOrdinalNumber(taskIdentity);

    const boundaryOrdinalNumber =
      await this.entities.searchForLowerOrdinalNumber(taskOrdinalNumber);

    if (boundaryOrdinalNumber === null) {
      return taskOrdinalNumber - this.orderingConfig.ordinalNumbersSpacing;
    }

    return (
      taskOrdinalNumber -
      Math.floor((taskOrdinalNumber - boundaryOrdinalNumber) / 2)
    );
  }
}
