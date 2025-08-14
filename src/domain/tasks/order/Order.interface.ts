import { IdentityValue } from "@domain/IdentityValue";

export interface OrderInterface {
  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null>;

  searchForLowestOrdinalNumber(): Promise<number | null>;

  getOrdinalNumber(identity: IdentityValue): Promise<number>;
}

export const OrderInterfaceSymbol = Symbol.for("OrderInterface");
