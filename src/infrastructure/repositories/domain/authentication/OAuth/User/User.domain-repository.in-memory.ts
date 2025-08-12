import { UserInterface } from "@domain/authentication/OAuth/User/User.interface";
import { EmailValue } from "@domain/authentication/OAuth/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { User } from "@domain/authentication/OAuth/User/User";
import * as assert from "node:assert";

export class UserDomainRepositoryInMemory implements UserInterface {
  public users = new Map<string, User>();

  getByEmail(email: EmailValue): Promise<User> {
    for (const user of this.users.values()) {
      if (user.email.isEqual(email)) {
        return Promise.resolve(user);
      }
    }
    throw new Error("Not found");
  }

  persist(user: User): Promise<void> {
    this.users.set(user.identity.toString(), user);
    return Promise.resolve();
  }

  retrieve(identity: IdentityValue): Promise<User> {
    const user = this.users.get(identity.toString());
    assert(user, "Not found");
    return Promise.resolve(user);
  }
}
