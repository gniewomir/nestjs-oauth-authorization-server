import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";
import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";

export class ContextsDomainRepository implements ContextsInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  persist(_context: Context): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  retrieve(_identity: IdentityValue): Promise<Context> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOrderKey(_identity: IdentityValue): Promise<string> {
    throw new Error("Method not implemented.");
  }

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    _orderKey: string,
  ): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    return Promise.resolve(null);
  }

  searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    _orderKey: string,
  ): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    return Promise.resolve(null);
  }
}
