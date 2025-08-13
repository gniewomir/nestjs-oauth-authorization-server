import {
  TUserConstructorParam,
  User,
} from "@domain/authentication/OAuth/User/User";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { randomString } from "@test/randomString";

export const userMother = (params: Partial<TUserConstructorParam> = {}) => {
  return new User({
    identity: IdentityValue.create(),
    email: EmailValue.fromString(
      `${IdentityValue.create().toString()}@gmail.com`,
    ),
    refreshTokens: [],
    hashedPassword: randomString(16),
    emailVerified: false,
    ...params,
  });
};
