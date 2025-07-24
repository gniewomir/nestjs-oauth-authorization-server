import { IdentityValue } from "../../IdentityValue";
import { Context } from "./Context";

export interface ContextInterface {
  retrieve(identity: IdentityValue): Promise<Context>;

  persist(context: Context): Promise<void>;
}
