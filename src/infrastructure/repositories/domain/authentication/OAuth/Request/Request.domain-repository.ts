import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { Request as DomainRequest } from "@domain/authentication/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthorizationRequest as DatabaseRequest } from "@infrastructure/database/entities/authorization-request.entity";

@Injectable()
export class RequestDomainRepository implements RequestInterface {
  constructor(
    @InjectRepository(DatabaseRequest)
    private readonly requestRepository: Repository<DatabaseRequest>,
  ) {}

  async getByAuthorizationCode(
    authorizationCode: string,
  ): Promise<DomainRequest> {
    const request = await this.requestRepository
      .createQueryBuilder("request")
      .where("request.\"authorizationCode\"->>'code' = :authorizationCode", {
        authorizationCode,
      })
      .getOne();

    if (!request) {
      throw new Error("Authorization request not found");
    }

    return this.mapToDomain(request);
  }

  async persist(authorizationRequest: DomainRequest): Promise<void> {
    const databaseRequest = this.mapToDatabase(authorizationRequest);
    await this.requestRepository.save(databaseRequest);
  }

  async retrieve(id: IdentityValue): Promise<DomainRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: id.toString() },
    });

    if (!request) {
      throw new Error("Authorization request not found");
    }

    return this.mapToDomain(request);
  }

  private mapToDomain(databaseRequest: DatabaseRequest): DomainRequest {
    return new DomainRequest({
      id: IdentityValue.fromString(databaseRequest.id),
      responseType: ResponseTypeValue.fromString(databaseRequest.responseType),
      clientId: IdentityValue.fromString(databaseRequest.clientId),
      redirectUri: HttpUrlValue.fromString(databaseRequest.redirectUri),
      state: databaseRequest.state,
      codeChallenge: databaseRequest.codeChallenge,
      codeChallengeMethod: CodeChallengeMethodValue.fromString(
        databaseRequest.codeChallengeMethod,
      ),
      scope: ScopeValueImmutableSet.fromString(databaseRequest.scope),
      authorizationCode:
        databaseRequest.authorizationCode === null
          ? null
          : Code.fromUnknown(databaseRequest.authorizationCode),
    });
  }

  private mapToDatabase(
    domainRequest: DomainRequest,
  ): Omit<DatabaseRequest, "createdAt" | "updatedAt"> {
    return {
      id: domainRequest.id.toString(),
      responseType: domainRequest.responseType.toString(),
      clientId: domainRequest.clientId.toString(),
      redirectUri: domainRequest.redirectUri.toString(),
      state: domainRequest.state,
      codeChallenge: domainRequest.codeChallenge,
      codeChallengeMethod: domainRequest.codeChallengeMethod.toString(),
      scope: domainRequest.scope.toString(),
      authorizationCode: domainRequest.authorizationCode,
    };
  }
}
