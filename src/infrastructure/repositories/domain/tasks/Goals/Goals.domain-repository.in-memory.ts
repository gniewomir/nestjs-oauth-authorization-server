import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { Goal } from "@domain/tasks/goal/Goal";
import { IdentityValue } from "@domain/IdentityValue";

export class GoalsDomainRepositoryInMemory implements GoalsInterface {
  public goals = new Map<string, Goal>();

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const goal = await this.retrieve(identity);
    return Promise.resolve(goal.ordinalNumber);
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

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = Array.from(this.goals.values()).toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    for (const goal of sorted) {
      if (ordinalNumber > goal.ordinalNumber) {
        return Promise.resolve(goal.ordinalNumber);
      }
    }

    return Promise.resolve(null);
  }

  async searchForLowestOrdinalNumber(): Promise<number | null> {
    const sorted = Array.from(this.goals.values()).toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
  }
}
