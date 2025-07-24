import { IdentityValue } from "../IdentityValue";
import { Task } from "./Task";

export interface TaskInterface {
  retrieve(identity: IdentityValue): Promise<Task>;

  persist(task: Task): Promise<void>;
}
