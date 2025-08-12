import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Goal } from "@domain/tasks/goal/Goal";

export class GoalsDomainRepository implements GoalsInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  persist(_goal: Goal): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  retrieve(_identity: IdentityValue): Promise<Goal> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOrdinalNumber(identity: IdentityValue): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForLowerOrdinalNumber(_ordinalNumber: number): Promise<number | null> {
    throw new Error("Method not implemented.");
  }

  searchForLowestOrdinalNumber(): Promise<number | null> {
    throw new Error("Method not implemented.");
  }
}
