import { UsersInterface } from "@domain/authentication/OAuth/User/Users.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";

export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
