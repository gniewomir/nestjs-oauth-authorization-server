import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { Goal } from "@domain/tasks/goal/Goal";
import { IdentityValue } from "@domain/IdentityValue";

export class GoalsDomainRepositoryInMemory implements GoalsInterface {
  public goals: Goal[] = [];

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const goal = await this.retrieve(identity);
    return Promise.resolve(goal.ordinalNumber);
  }

  persist(goal: Goal): Promise<void> {
    this.goals.push(goal);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Goal> {
    for (const goal of this.goals) {
      if (identity.isEqual(goal.identity)) {
        return Promise.resolve(goal);
      }
    }
    throw new Error("Not found.");
  }

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = this.goals.toSorted(
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
    const sorted = this.goals.toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
  }
}
