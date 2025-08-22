import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { IntentValue } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { Request as DomainRequest } from "@domain/auth/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/auth/OAuth/Authorization/Request.interface";
import { ResolutionValue } from "@domain/auth/OAuth/Authorization/ResolutionValue";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthorizationRequest as DatabaseRequest } from "@infrastructure/database/entities/authorization-request.entity";
import { AssertFound } from "@infrastructure/repositories/AssertFound";

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

    AssertFound(request, "Authorization request not found");

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

    AssertFound(request, "Authorization request not found");

    return this.mapToDomain(request);
  }

  private mapToDomain(databaseRequest: DatabaseRequest): DomainRequest {
    return new DomainRequest({
      id: IdentityValue.fromString(databaseRequest.id),
      responseType: ResponseTypeValue.fromString(databaseRequest.responseType),
      clientId: IdentityValue.fromString(databaseRequest.clientId),
      redirectUri: RedirectUriValue.fromString(databaseRequest.redirectUri),
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
      intent:
        databaseRequest.intent === null
          ? null
          : IntentValue.fromString(databaseRequest.intent),
      resolution: ResolutionValue.fromString(databaseRequest.resolution),
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
      intent: domainRequest.intent ? domainRequest.intent.toString() : null,
      resolution: domainRequest.resolution.toString(),
    };
  }
}
