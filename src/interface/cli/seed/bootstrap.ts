import { clientMother, userMother } from "@test/domain/authentication";
import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";

import { commandBootstrap } from "@application/command";
import { Assert } from "@domain/Assert";
import { ClientInterfaceSymbol } from "@domain/authentication/OAuth/Client/Client.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { PasswordInterfaceSymbol } from "@domain/authentication/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { UsersInterfaceSymbol } from "@domain/authentication/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { ClientDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/Client";
import { UserDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/User";
import { PasswordService } from "@infrastructure/security/password";
import { SeedModule } from "@interface/cli/seed/seed.module";

void commandBootstrap({
  name: "test:manual:seed",
  baseModule: SeedModule,
  payload: async ({ application, logger, appConfig }) => {
    Assert(
      appConfig.env === "development" || appConfig.env === "test",
      "Expected development of test environment",
    );
    const clients = application.get<ClientDomainRepository>(
      ClientInterfaceSymbol,
    );
    const client = clientMother({
      id: IdentityValue.fromString("4072ccc4-5975-4d24-828d-495eb2f65c0a"),
      name: "Swagger",
      scope: defaultTestClientScopesMother(),
    });
    await clients.persist(client);
    logger.log(
      `Added OAuth client "${client.name}" with id "${client.id.toString()}" and scopes "${client.scope.toString()}"`,
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
    logger.log(
      `Added user "${userPlaintextEmail}" and password "${userPlaintextPassword}"`,
    );
  },
});
