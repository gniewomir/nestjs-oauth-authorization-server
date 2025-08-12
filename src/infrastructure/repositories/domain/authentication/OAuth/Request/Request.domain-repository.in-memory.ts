import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";
import * as assert from "node:assert";

export class RequestDomainRepositoryInMemory implements RequestInterface {
  public requests = new Map<string, Request>();

  persist(request: Request): Promise<void> {
    this.requests.set(request.id.toString(), request);
    return Promise.resolve();
  }

  retrieve(id: IdentityValue): Promise<Request> {
    const request = this.requests.get(id.toString());
    assert(request, "Not found");
    return Promise.resolve(request);
  }

  getByAuthorizationCode(authorizationCode: string): Promise<Request> {
    for (const request of this.requests.values()) {
      if (request.authorizationCode?.authorizationCode === authorizationCode) {
        return Promise.resolve(request);
      }
    }
    throw new Error(`Not found`);
  }
}
