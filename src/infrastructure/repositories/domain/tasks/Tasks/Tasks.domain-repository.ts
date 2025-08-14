import { IdentityValue } from "@domain/IdentityValue";
import { Task } from "@domain/tasks/task/Task";
import { TasksInterface } from "@domain/tasks/task/Tasks.interface";

export class TasksDomainRepository implements TasksInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  persist(_task: Task): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  retrieve(_identity: IdentityValue): Promise<Task> {
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
