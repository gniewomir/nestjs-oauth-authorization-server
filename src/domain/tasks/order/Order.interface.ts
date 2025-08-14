import { IdentityValue } from "@domain/IdentityValue";

export interface OrderInterface {
  getOrderKey(identity: IdentityValue): Promise<string>;

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null>;

  searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null>;

  searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null>;

  searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null>;
}

export const OrderInterfaceSymbol = Symbol.for("OrderInterface");
