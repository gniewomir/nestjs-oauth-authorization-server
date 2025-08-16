import {
  Client,
  TClientConstructorParam,
} from "@domain/authentication/OAuth/Client/Client";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { IdentityValue } from "@domain/IdentityValue";

export class AdminFacade {
  public static async registerOauthClient(
    { name, scope, redirectUri }: Omit<TClientConstructorParam, "id">,
    clients: ClientInterface,
  ): Promise<void> {
    await clients.persist(
      Client.create({
        name,
        scope,
        redirectUri,
        id: IdentityValue.create(),
      }),
    );
  }
}
