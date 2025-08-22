import * as assert from "node:assert";

import { clientMother, userMother } from "@test/domain/authentication";
import { rememberMeTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";

import { cliBootstrap } from "@application/app";
import {
  ClientInterfaceSymbol,
  RedirectUriValue,
} from "@domain/auth/OAuth/Client";
import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User";
import {
  EmailValue,
  PasswordInterfaceSymbol,
  PasswordValue,
} from "@domain/auth/OAuth/User/Credentials";
import { IdentityValue } from "@domain/IdentityValue";
import {
  ClientDomainRepository,
  UserDomainRepository,
} from "@infrastructure/repositories/domain/authentication/OAuth";
import { PasswordService } from "@infrastructure/security/password";
import { SeedModule } from "@interface/cli/seed/seed.module";

void cliBootstrap({
  name: "test:seed",
  baseModule: SeedModule,
  payload: async ({ application, logger, appConfig }) => {
    assert(
      appConfig.nodeEnv === "development" || appConfig.nodeEnv === "test",
      "Expected development of test environment",
    );
    const clients = application.get<ClientDomainRepository>(
      ClientInterfaceSymbol,
    );
    const client = clientMother({
      id: IdentityValue.fromString("4072ccc4-5975-4d24-828d-495eb2f65c0a"),
      name: "Swagger",
      scope: rememberMeTestClientScopesMother(),
      redirectUri: RedirectUriValue.create(
        "http://localhost:3000/open-api/oauth2-redirect.html",
        "test",
      ),
    });
    await clients.persist(client);
    logger.info(
      `Added OAuth client "${client.name}". ID: ${client.id.toString()}; Scopes: "${client.scope.toString()}"; Redirect: "${client.redirectUri.toString()}"`,
    );

    const passwords = application.get<PasswordService>(PasswordInterfaceSymbol);
    const users = application.get<UserDomainRepository>(UsersInterfaceSymbol);
    const userPlaintextPassword = "abcdefghijkl";
    const userPlaintextEmail = "john.doe@test.com";
    const user = userMother({
      identity: IdentityValue.fromString(
        "4a7ead9d-926e-4222-bc4d-9849b4971d31",
      ),
      email: EmailValue.fromString(userPlaintextEmail),
      password: await passwords.hashPlaintextPassword(
        PasswordValue.create(userPlaintextPassword).toString(),
      ),
    });
    await users.persist(user);
    logger.info(
      `Added user "${userPlaintextEmail}" and password "${userPlaintextPassword}"`,
    );
  },
});
