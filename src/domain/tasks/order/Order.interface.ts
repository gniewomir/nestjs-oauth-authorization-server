import { IdentityValue } from "@domain/IdentityValue";

export interface OrderInterface {
  getOrderKey(identity: IdentityValue): Promise<string>;

  searchForLowerOrderKey(orderKey: string): Promise<string | null>;

  searchForHigherOrderKey(orderKey: string): Promise<string | null>;

  searchForHighestOrderKey(): Promise<string | null>;

  searchForLowestOrderKey(): Promise<string | null>;
}

export const OrderInterfaceSymbol = Symbol.for("OrderInterface");
