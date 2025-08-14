import { OrderInterface } from "@domain/tasks/order/Order.interface";

import { IdentityValue } from "../../IdentityValue";

import { Task } from "./Task";

export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;

  persist(task: Task): Promise<void>;
}

export const TasksInterfaceSymbol = Symbol.for("TasksInterface");
