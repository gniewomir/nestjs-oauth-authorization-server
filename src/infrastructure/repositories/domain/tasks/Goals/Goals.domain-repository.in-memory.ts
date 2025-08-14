import { IdentityValue } from "@domain/IdentityValue";
import { Goal } from "@domain/tasks/goal/Goal";
import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";

export class GoalsDomainRepositoryInMemory implements GoalsInterface {
  public goals = new Map<string, Goal>();

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const goal = await this.retrieve(identity);
    return Promise.resolve(goal.orderKey);
  }

  persist(goal: Goal): Promise<void> {
    this.goals.set(goal.identity.toString(), goal);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Goal> {
    const goal = this.goals.get(identity.toString());
    if (goal instanceof Goal) {
      return Promise.resolve(goal);
    }
    return Promise.reject(new Error("Goal not found"));
  }

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const sorted = Array.from(this.goals.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    let previous: string | null = null;
    for (const goal of sorted) {
      if (orderKey > goal.orderKey) {
        previous = goal.orderKey;
      } else if (orderKey === goal.orderKey) {
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
    const sorted = Array.from(this.goals.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
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
    const sorted = Array.from(this.goals.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
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
    const sorted = Array.from(this.goals.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    for (const goal of sorted) {
      if (goal.orderKey > orderKey) {
        return Promise.resolve(goal.orderKey);
      }
    }

    return Promise.resolve(null);
  }
}
