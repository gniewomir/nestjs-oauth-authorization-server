import { clientMother } from "@test/domain/authentication";
import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";

import { commandBootstrap } from "@application/command";
import { Assert } from "@domain/Assert";
import { ClientInterfaceSymbol } from "@domain/authentication/OAuth/Client/Client.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { ClientDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/Client";
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
  },
});
