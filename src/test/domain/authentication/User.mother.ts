import { randomString } from "@test/utility/randomString";

import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import {
  TUserConstructorParam,
  User,
} from "@domain/authentication/OAuth/User/User";
import { IdentityValue } from "@domain/IdentityValue";

export const userMother = (params: Partial<TUserConstructorParam> = {}) => {
  return new User({
    identity: IdentityValue.create(),
    email: EmailValue.fromString(
      `${IdentityValue.create().toString()}@gmail.com`,
    ),
    refreshTokens: [],
    password: randomString(16),
    emailVerified: false,
    ...params,
  });
};
