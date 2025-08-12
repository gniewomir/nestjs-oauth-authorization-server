import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { IdentityValue } from "@domain/IdentityValue";

export class ClientDomainRepository implements ClientInterface {
  persist(_client: Client): Promise<void> {
    throw new Error("Method not implemented.");
  }

  retrieve(_id: IdentityValue): Promise<Client> {
    throw new Error("Method not implemented.");
  }
}
