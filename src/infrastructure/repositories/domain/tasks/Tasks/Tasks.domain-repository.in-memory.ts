import { IdentityValue } from "@domain/IdentityValue";
import { Task } from "@domain/tasks/task/Task";
import { TasksInterface } from "@domain/tasks/task/Tasks.interface";

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

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const task = await this.retrieve(identity);
    return Promise.resolve(task.orderKey);
  }

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const sorted = Array.from(this.tasks.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    let previous: string | null = null;
    for (const task of sorted) {
      if (orderKey > task.orderKey) {
        previous = task.orderKey;
      } else if (orderKey === task.orderKey) {
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
    const sorted = Array.from(this.tasks.values())
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
    const sorted = Array.from(this.tasks.values())
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
    const sorted = Array.from(this.tasks.values())
      .filter(
        (t) => t.assigned.identity.toString() === assignedIdentity.toString(),
      )
      .toSorted((a, b) =>
        a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
      );

    for (const task of sorted) {
      if (task.orderKey > orderKey) {
        return Promise.resolve(task.orderKey);
      }
    }

    return Promise.resolve(null);
  }
}
