import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { User } from "@domain/auth/OAuth/User/User";
import { UsersInterface } from "@domain/auth/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { DatabaseNotFoundException } from "@infrastructure/repositories/DatabaseNotFoundException";

export class UserDomainRepositoryInMemory implements UsersInterface {
  public users = new Map<string, User>();

  countByEmail(email: EmailValue): Promise<number> {
    const count = Array.from(this.users.values()).filter((user) =>
      user.email.isEqual(email),
    ).length;
    return Promise.resolve(count);
  }

  async getByEmail(email: EmailValue): Promise<User> {
    for (const user of this.users.values()) {
      if (user.email.isEqual(email)) {
        return Promise.resolve(user);
      }
    }
    return Promise.reject(new DatabaseNotFoundException("User not found"));
  }

  persist(user: User): Promise<void> {
    this.users.set(user.identity.toString(), user);
    return Promise.resolve();
  }

  retrieve(identity: IdentityValue): Promise<User> {
    const user = this.users.get(identity.toString());
    if (user instanceof User) {
      return Promise.resolve(user);
    }
    return Promise.reject(new DatabaseNotFoundException("User not found"));
  }
}
