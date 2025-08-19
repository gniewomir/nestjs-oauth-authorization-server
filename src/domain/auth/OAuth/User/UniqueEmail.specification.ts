import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { UsersInterface } from "@domain/auth/OAuth/User/Users.interface";

export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
