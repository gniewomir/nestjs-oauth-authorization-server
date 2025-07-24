import { IdentityValue } from "../../IdentityValue";
import { Assigned } from "./Assigned";

export interface AssignedInterface {
  retrieve(identity: IdentityValue): Promise<Assigned>;
}
