import { Request } from "@domain/auth/OAuth/Authorization/Request";
import { IdentityValue } from "@domain/IdentityValue";

export interface RequestInterface {
  persist(authorisationRequest: Request): Promise<void>;

  retrieve(id: IdentityValue): Promise<Request>;

  getByAuthorizationCode(authorizationCode: string): Promise<Request>;
}

export const RequestInterfaceSymbol = Symbol.for("RequestInterface");
