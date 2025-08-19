import { Inject, Injectable } from "@nestjs/common";

import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import {
  PasswordInterface,
  PasswordInterfaceSymbol,
} from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/auth/OAuth/User/Credentials/PasswordValue";
import {
  UsersInterface,
  UsersInterfaceSymbol,
} from "@domain/auth/OAuth/User/Users.interface";
import { UserFacade } from "@domain/auth/User.facade";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersInterfaceSymbol)
    private readonly users: UsersInterface,
    @Inject(PasswordInterfaceSymbol)
    private readonly passwords: PasswordInterface,
  ) {}

  async register(params: { email: string; password: string }): Promise<{
    userId: string;
    email: string;
    emailVerified: boolean;
  }> {
    const email = EmailValue.fromString(params.email);
    const password = PasswordValue.fromString(params.password);

    const result = await UserFacade.register(
      { email, password },
      this.users,
      this.passwords,
    );

    return {
      userId: result.identity.toString(),
      email: result.user.email.toString(),
      emailVerified: result.user.emailVerified,
    };
  }

  async show(params: { userId: string }): Promise<{
    userId: string;
    email: string;
    emailVerified: boolean;
  }> {
    const user = await NotFoundToDomainException(
      () => this.users.retrieve(IdentityValue.fromString(params.userId)),
      () => new Error(`User with ID ${params.userId} not found`),
    );

    return {
      userId: user.identity.toString(),
      email: user.email.toString(),
      emailVerified: user.emailVerified,
    };
  }
}
