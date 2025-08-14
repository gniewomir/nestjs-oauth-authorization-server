import { IdentityValue } from "@domain/IdentityValue";
import { Goal } from "@domain/tasks/goal/Goal";
import { GoalsInterface } from "@domain/tasks/goal/Goals.interface";

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
  getOrderKey(identity: IdentityValue): Promise<string> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForLowerOrderKey(_orderKey: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForHighestOrderKey(): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchForHigherOrderKey(_orderKey: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  searchForLowestOrderKey(): Promise<string | null> {
    return Promise.resolve(null);
  }
}
