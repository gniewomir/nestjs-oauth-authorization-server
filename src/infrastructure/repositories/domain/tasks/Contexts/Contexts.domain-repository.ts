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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForLowerOrderKey(_orderKey: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForHighestOrderKey(): Promise<string | null> {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForHigherOrderKey(_orderKey: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForLowestOrderKey(): Promise<string | null> {
    return Promise.resolve(null);
  }
}
