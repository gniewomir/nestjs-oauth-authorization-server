import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";

export class RequestDomainRepository implements RequestInterface {
  getByAuthorizationCode(_authorizationCode: string): Promise<Request> {
    throw new Error("Method not implemented.");
  }

  persist(_authorisationRequest: Request): Promise<void> {
    throw new Error("Method not implemented.");
  }

  retrieve(_id: IdentityValue): Promise<Request> {
    throw new Error("Method not implemented.");
  }
}
