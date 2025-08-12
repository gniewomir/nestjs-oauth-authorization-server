import { User } from "@domain/authentication/OAuth/User/User";
import { IdentityValue } from "@domain/IdentityValue";
import { EmailValue } from "@domain/authentication/OAuth/Credentials/EmailValue";

export interface UserInterface {
  retrieve(identity: IdentityValue): Promise<User>;

  persist(user: User): Promise<void>;

  getByEmail(email: EmailValue): Promise<User>;
}
