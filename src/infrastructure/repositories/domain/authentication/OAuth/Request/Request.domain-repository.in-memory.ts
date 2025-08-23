import * as assert from "node:assert";

import { cloneDeep } from "lodash";

import { Request } from "@domain/auth/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/auth/OAuth/Authorization/Request.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { DatabaseNotFoundException } from "@infrastructure/repositories/DatabaseNotFoundException";

export class RequestDomainRepositoryInMemory implements RequestInterface {
  public requests = new Map<string, Request>();

  async useAuthorizationCodeAtomically(
    authorizationCode: string,
    clock: ClockInterface,
  ): Promise<Request> {
    for (const request of this.requests.values()) {
      const code = request.authorizationCode;
      if (
        code &&
        code.code === authorizationCode &&
        !code.used &&
        code.exp > clock.nowAsSecondsSinceEpoch()
      ) {
        const clonedRequest = cloneDeep(request);
        const usedCode = clonedRequest.authorizationCode;
        assert(usedCode);
        usedCode.markAsUsed();
        this.requests.set(request.id.toString(), clonedRequest);

        return Promise.resolve(this.retrieve(clonedRequest.id));
      }
    }
    throw new DatabaseNotFoundException(
      "Authorization code not found, already used, or expired",
    );
  }

  async persist(authorisationRequest: Request): Promise<void> {
    this.requests.set(
      authorisationRequest.id.toString(),
      cloneDeep(authorisationRequest),
    );
    return Promise.resolve();
  }

  async retrieve(id: IdentityValue): Promise<Request> {
    const request = this.requests.get(id.toString());
    if (request instanceof Request) {
      return Promise.resolve(cloneDeep(request));
    }
    return Promise.reject(
      new DatabaseNotFoundException("Authorization request not found"),
    );
  }
}
