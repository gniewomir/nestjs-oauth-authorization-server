import { UserInterface } from "@domain/authentication/OAuth/User/User.interface";
import { EmailValue } from "@domain/authentication/OAuth/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { User } from "@domain/authentication/OAuth/User/User";

export class UserDomainRepository implements UserInterface {
  getByEmail(_email: EmailValue): Promise<User> {
    throw new Error("Not implemented.");
  }

  persist(_user: User): Promise<void> {
    throw new Error("Not implemented.");
  }

  retrieve(_identity: IdentityValue): Promise<User> {
    throw new Error("Not implemented.");
  }
}
