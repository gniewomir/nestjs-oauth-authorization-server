import { IdentityValue } from "../../IdentityValue";
import { Context } from "./Context";
import { OrderInterface } from "@domain/tasks/order";

export interface ContextsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Context>;

  persist(context: Context): Promise<void>;
}
