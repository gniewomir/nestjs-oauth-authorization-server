import { TasksInterface } from "@domain/tasks/task/Tasks.interface";
import { Task } from "@domain/tasks/task/Task";
import { IdentityValue } from "@domain/IdentityValue";

export class TasksDomainRepositoryInMemory implements TasksInterface {
  public tasks: Task[] = [];

  persist(task: Task): Promise<void> {
    this.tasks.push(task);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Task> {
    for (const task of this.tasks) {
      if (identity.isEqual(task.identity)) {
        return Promise.resolve(task);
      }
    }
    throw new Error("Not found.");
  }

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const task = await this.retrieve(identity);
    return Promise.resolve(task.ordinalNumber);
  }

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = this.tasks.toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    for (const task of sorted) {
      if (ordinalNumber > task.ordinalNumber) {
        return Promise.resolve(task.ordinalNumber);
      }
    }

    return Promise.resolve(null);
  }

  async searchForLowestOrdinalNumber(): Promise<number | null> {
    const sorted = this.tasks.toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
  }
}
