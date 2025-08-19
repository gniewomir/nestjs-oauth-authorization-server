import { Client } from "@domain/auth/OAuth/Client/Client";
import { IdentityValue } from "@domain/IdentityValue";

export interface ClientInterface {
  persist(client: Client): Promise<void>;

  retrieve(id: IdentityValue): Promise<Client>;
}

export const ClientInterfaceSymbol = Symbol.for("ClientInterface");
