import {
  TUserConstructorParam,
  User,
} from "@domain/authentication/OAuth/User/User";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { PasswordInterface } from "@domain/authentication/OAuth/User/Credentials/Password.interface";

export const userMother = async (
  params: Partial<TUserConstructorParam> = {},
  deps: {
    plaintextPassword: string;
    passwordInterface: PasswordInterface;
  },
) => {
  const hashedPassword = await deps.passwordInterface.hashPlaintextPassword(
    deps.plaintextPassword,
  );

  return new User({
    identity: IdentityValue.create(),
    email: EmailValue.fromString(
      `${IdentityValue.create().toString()}@gmail.com`,
    ),
    refreshTokens: [],
    hashedPassword,
    emailVerified: false,
    ...params,
  });
};
