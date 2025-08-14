import { OrderInterface } from "@domain/tasks/order";

import { IdentityValue } from "../../IdentityValue";

import { Goal } from "./Goal";

export interface GoalsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Goal>;

  persist(goal: Goal): Promise<void>;
}

export const GoalsInterfaceSymbol = Symbol.for("GoalsInterface");
