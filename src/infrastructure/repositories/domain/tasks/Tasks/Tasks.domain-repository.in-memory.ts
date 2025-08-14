import { TasksInterface } from "@domain/tasks/task/Tasks.interface";
import { Task } from "@domain/tasks/task/Task";
import { IdentityValue } from "@domain/IdentityValue";

export class TasksDomainRepositoryInMemory implements TasksInterface {
  public tasks = new Map<string, Task>();

  persist(task: Task): Promise<void> {
    this.tasks.set(task.identity.toString(), task);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Task> {
    const task = this.tasks.get(identity.toString());
    if (task instanceof Task) {
      return Promise.resolve(task);
    }
    return Promise.reject(new Error("Task not found"));
  }

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const task = await this.retrieve(identity);
    return Promise.resolve(task.ordinalNumber);
  }

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = Array.from(this.tasks.values()).toSorted(
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
    const sorted = Array.from(this.tasks.values()).toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
  }
}
