import { UsersInterface } from "@domain/authentication/OAuth/User/Users.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { User } from "@domain/authentication/OAuth/User/User";
import * as assert from "node:assert";

export class UserDomainRepositoryInMemory implements UsersInterface {
  public users = new Map<string, User>();

  countByEmail(email: EmailValue): Promise<number> {
    const count = Array.from(this.users.values()).filter((user) =>
      user.email.isEqual(email),
    ).length;
    return Promise.resolve(count);
  }

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
