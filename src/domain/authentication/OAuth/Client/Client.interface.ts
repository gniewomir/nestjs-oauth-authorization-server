import { IdentityValue } from "@domain/IdentityValue";
import { Client } from "@domain/authentication/OAuth/Client/Client";

export interface ClientInterface {
  persist(client: Client): Promise<void>;

  retrieve(id: IdentityValue): Promise<Client>;
}
