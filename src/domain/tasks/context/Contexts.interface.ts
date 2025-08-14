import { OrderInterface } from "@domain/tasks/order";

import { IdentityValue } from "../../IdentityValue";

import { Context } from "./Context";

export interface ContextsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Context>;

  persist(context: Context): Promise<void>;
}

export const ContextsInterfaceSymbol = Symbol.for("ContextsInterface");
