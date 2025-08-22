import {
  Client,
  TClientConstructorParam,
} from "@domain/auth/OAuth/Client/Client";
import { ClientInterface } from "@domain/auth/OAuth/Client/Client.interface";
import { IdentityValue } from "@domain/IdentityValue";

export class AdminFacade {
  public static async registerOauthClient(
    {
      name,
      scope,
      redirectUri,
      registration,
    }: Omit<TClientConstructorParam, "id">,
    clients: ClientInterface,
  ): Promise<void> {
    await clients.persist(
      Client.create({
        name,
        scope,
        redirectUri,
        registration,
        id: IdentityValue.create(),
      }),
    );
  }
}
