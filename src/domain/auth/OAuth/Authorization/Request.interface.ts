import { Request } from "@domain/auth/OAuth/Authorization/Request";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";

export interface RequestInterface {
  persist(authorisationRequest: Request): Promise<void>;

  retrieve(id: IdentityValue): Promise<Request>;

  useAuthorizationCodeAtomically(
    authorizationCode: string,
    clock: ClockInterface,
  ): Promise<Request>;
}

export const RequestInterfaceSymbol = Symbol.for("RequestInterface");
