import { AuthorizationCodeService } from "@infrastructure/authentication/authorization-code/authorization-code.service";
import { JwtServiceFake } from "@infrastructure/authentication/jwt";
import { PKCEServiceFake } from "@infrastructure/authentication/pkce";
import { userMother } from "@test/domain/authentication/User.mother";
import { plainToConfig } from "@infrastructure/config/configs/utility";
import { UserDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.in-memory";
import { IdentityValue } from "@domain/IdentityValue";
import { RequestDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository.in-memory";
import { AuthConfig, authConfigDefaults } from "@infrastructure/config/configs";
import { PasswordService } from "@infrastructure/authentication/password";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { ClientDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository.in-memory";
import { clientMother } from "@test/domain/authentication/Client.mother";

export const createAuthorizationContext = async () => {
  const clients = new ClientDomainRepositoryInMemory();
  const client = clientMother();
  await clients.persist(client);

  const requests = new RequestDomainRepositoryInMemory();
  const requestId = IdentityValue.create();

  const users = new UserDomainRepositoryInMemory();
  const authConfig = await plainToConfig(authConfigDefaults, AuthConfig);
  const passwords = new PasswordService(authConfig);
  const userPassword = "abcdefghijklmnopqrstq";
  const user = await userMother(
    {},
    { plaintextPassword: userPassword, passwordInterface: passwords },
  );
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
