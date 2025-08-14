import { IdentityValue } from "@domain/IdentityValue";
import { Context } from "@domain/tasks/context/Context";
import { ContextsInterface } from "@domain/tasks/context/Contexts.interface";

export class ContextsDomainRepositoryInMemory implements ContextsInterface {
  public contexts = new Map<string, Context>();

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const goal = await this.retrieve(identity);
    return Promise.resolve(goal.orderKey);
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

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const sorted = Array.from(this.contexts.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    let previous: string | null = null;
    for (const context of sorted) {
      if (orderKey > context.orderKey) {
        previous = context.orderKey;
      } else if (orderKey === context.orderKey) {
        return Promise.resolve(previous);
      } else {
        break;
      }
    }

    return Promise.resolve(previous);
  }

  async searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const sorted = Array.from(this.contexts.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].orderKey;
  }

  async searchForLowestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const sorted = Array.from(this.contexts.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[0].orderKey;
  }

  searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const sorted = Array.from(this.contexts.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    for (const context of sorted) {
      if (context.orderKey > orderKey) {
        return Promise.resolve(context.orderKey);
      }
    }

    return Promise.resolve(null);
  }
}
