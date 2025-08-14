import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { User } from "@domain/authentication/OAuth/User/User";
import { IdentityValue } from "@domain/IdentityValue";

export interface UsersInterface {
  retrieve(identity: IdentityValue): Promise<User>;

  persist(user: User): Promise<void>;

  getByEmail(email: EmailValue): Promise<User>;

  countByEmail(email: EmailValue): Promise<number>;
}

export const UsersInterfaceSymbol = Symbol.for("UsersInterface");
