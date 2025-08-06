import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";

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
  getOrdinalNumber(_identity: IdentityValue): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForLowerOrdinalNumber(_ordinalNumber: number): Promise<number | null> {
    throw new Error("Method not implemented.");
  }

  searchForLowestOrdinalNumber(): Promise<number | null> {
    return Promise.resolve(null);
  }
}
