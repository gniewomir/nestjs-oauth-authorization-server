import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";
import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";

export class ContextsDomainRepositoryInMemory implements ContextsInterface {
  public contexts = new Map<string, Context>();

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const goal = await this.retrieve(identity);
    return Promise.resolve(goal.ordinalNumber);
  }

  persist(context: Context): Promise<void> {
    this.contexts.set(context.identity.toString(), context);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Context> {
    const context = this.contexts.get(identity.toString());
    if (context instanceof Context) {
      return Promise.resolve(context);
    }
    return Promise.reject(new Error("Context not found"));
  }

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = Array.from(this.contexts.values()).toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    for (const context of sorted) {
      if (ordinalNumber > context.ordinalNumber) {
        return Promise.resolve(context.ordinalNumber);
      }
    }

    return Promise.resolve(null);
  }

  async searchForLowestOrdinalNumber(): Promise<number | null> {
    const sorted = Array.from(this.contexts.values()).toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
  }
}
