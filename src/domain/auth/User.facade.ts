import { Assert } from "@domain/Assert";
import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { PasswordInterface } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/auth/OAuth/User/Credentials/PasswordValue";
import { UniqueEmailSpecification } from "@domain/auth/OAuth/User/UniqueEmail.specification";
import { User } from "@domain/auth/OAuth/User/User";
import { UsersInterface } from "@domain/auth/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";

export class UserFacade {
  public static async register(
    params: {
      email: EmailValue;
      password: PasswordValue;
    },
    users: UsersInterface,
    passwords: PasswordInterface,
  ): Promise<{
    user: User;
    identity: IdentityValue;
  }> {
    const uniqueEmailSpecification = new UniqueEmailSpecification(users);

    Assert(
      await uniqueEmailSpecification.isSatisfied(params.email),
      "User email must be unique",
    );

    const hashedPassword = await params.password.toPasswordHash(passwords);
    const identity = IdentityValue.create();

    const user = await User.create(
      {
        identity,
        email: params.email,
        emailVerified: false,
        password: hashedPassword,
        refreshTokens: [],
      },
      uniqueEmailSpecification,
    );

    await users.persist(user);

    return {
      user,
      identity,
    };
  }
}
