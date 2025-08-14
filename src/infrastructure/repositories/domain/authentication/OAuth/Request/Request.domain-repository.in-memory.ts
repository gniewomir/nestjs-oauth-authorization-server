import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";

export class RequestDomainRepositoryInMemory implements RequestInterface {
  public requests = new Map<string, Request>();

  async getByAuthorizationCode(authorizationCode: string): Promise<Request> {
    for (const request of this.requests.values()) {
      if (request.authorizationCode?.code === authorizationCode) {
        return Promise.resolve(request);
      }
    }
    throw new Error("Authorization request not found");
  }

  async persist(authorisationRequest: Request): Promise<void> {
    this.requests.set(authorisationRequest.id.toString(), authorisationRequest);
    return Promise.resolve();
  }

  async retrieve(id: IdentityValue): Promise<Request> {
    const request = this.requests.get(id.toString());
    if (request instanceof Request) {
      return Promise.resolve(request);
    }
    return Promise.reject(new Error("Authorization request not found"));
  }
}
