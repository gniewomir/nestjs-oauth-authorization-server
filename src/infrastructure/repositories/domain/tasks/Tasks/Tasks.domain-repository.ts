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
