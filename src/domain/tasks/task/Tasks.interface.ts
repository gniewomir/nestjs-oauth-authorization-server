import { IdentityValue } from "../../IdentityValue";
import { Task } from "./Task";
import { OrderInterface } from "@domain/tasks/order/Order.interface";

export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;

  persist(task: Task): Promise<void>;
}
