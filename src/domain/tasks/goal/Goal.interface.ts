import { IdentityValue } from "../../IdentityValue";
import { Goal } from "./Goal";

export interface GoalInterface {
  retrieve(identity: IdentityValue): Promise<Goal>;

  persist(goal: Goal): Promise<void>;
}
