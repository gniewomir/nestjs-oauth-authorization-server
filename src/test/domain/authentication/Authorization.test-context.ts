import { clientMother } from "@test/domain/authentication/Client.mother";
import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { userMother } from "@test/domain/authentication/User.mother";

import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";
import { ClientDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository.in-memory";
import { RequestDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository.in-memory";
import { UserDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.in-memory";
import { AuthorizationCodeService } from "@infrastructure/security/authorization-code/authorization-code.service";
import { JwtServiceFake } from "@infrastructure/security/jwt";
import { PasswordService } from "@infrastructure/security/password";
import { PKCEServiceFake } from "@infrastructure/security/pkce";

export const createAuthorizationTestContext = async ({
  clientScope,
}: {
  clientScope?: ScopeValueImmutableSet;
} = {}) => {
  const clients = new ClientDomainRepositoryInMemory();
  const client = clientMother({
    scope: clientScope ? clientScope : defaultTestClientScopesMother(),
  });
  await clients.persist(client);

  const requests = new RequestDomainRepositoryInMemory();
  const requestId = IdentityValue.create();

  const users = new UserDomainRepositoryInMemory();
  const authConfig = await plainToConfig({}, AuthConfig.defaults(), AuthConfig);
  const passwords = new PasswordService(authConfig);
  const userPassword = "abcdefghijklmnopqrstq";
  const user = userMother({
    password: await passwords.hashPlaintextPassword(userPassword),
  });
  await users.persist(user);

  const codes = new AuthorizationCodeService();
  const clock = new ClockServiceFake();
  const PKCE = new PKCEServiceFake();
  const codeVerifier = PKCE.generateCodeVerifier();
  const codeChallenge = PKCE.generateChallenge(codeVerifier);
  const tokenPayloads = new JwtServiceFake(authConfig);

  return {
    clients,
    client,
    users,
    user,
    userPassword,
    requests,
    requestId,
    authConfig,
    passwords,
    codes,
    clock,
    PKCE,
    tokenPayloads,
    codeVerifier,
    codeChallenge,
  };
};
