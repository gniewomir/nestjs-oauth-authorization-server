import { Client, ClientInterfaceSymbol } from "@domain/auth/OAuth";
import { IdentityValue } from "@domain/IdentityValue";
import { ClientDomainRepository } from "@infrastructure/repositories/domain";

import { OauthE2eTestContext } from "./oauth-e2e.test-context";

describe("OAuth2 e2e test context", () => {
  let context: OauthE2eTestContext;
  let clientId: IdentityValue;

  beforeAll(async () => {
    context = await OauthE2eTestContext.create();
    clientId = IdentityValue.create();
  });

  afterAll(async () => {
    await context.teardown();
  });

  it("can create oauth client", async () => {
    await context.createClient({
      id: clientId,
    });

    const clients = context
      .getApp()
      .get<ClientDomainRepository>(ClientInterfaceSymbol);
    const client = await clients.retrieve(clientId);

    expect(client).toBeInstanceOf(Client);
    expect(client.id.isEqual(clientId)).toBe(true);
  });

  it("rolls back transaction after the test - so client no longer exists", async () => {
    const clients = context
      .getApp()
      .get<ClientDomainRepository>(ClientInterfaceSymbol);

    await expect(clients.retrieve(clientId)).rejects.toThrow(
      "Client not found",
    );
  });
});
