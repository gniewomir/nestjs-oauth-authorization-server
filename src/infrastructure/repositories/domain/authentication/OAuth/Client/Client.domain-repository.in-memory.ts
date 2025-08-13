import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { IdentityValue } from "@domain/IdentityValue";

export class ClientDomainRepositoryInMemory implements ClientInterface {
  public clients = new Map<string, Client>();

  persist(client: Client): Promise<void> {
    this.clients.set(client.id.toString(), client);
    return Promise.resolve();
  }

  retrieve(id: IdentityValue): Promise<Client> {
    const client = this.clients.get(id.toString());
    if (client instanceof Client) {
      return Promise.resolve(client);
    }
    return Promise.reject(new Error("Client not found"));
  }
}
