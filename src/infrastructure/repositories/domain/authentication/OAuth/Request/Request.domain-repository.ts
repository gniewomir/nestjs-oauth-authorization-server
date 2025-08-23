import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import {
  IntentValue,
  Request as DomainRequest,
  RequestInterface,
  ResolutionValue,
  ResponseTypeValue,
} from "@domain/auth/OAuth/Authorization";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { RedirectUriValue } from "@domain/auth/OAuth/Client";
import { OauthInvalidCredentialsException } from "@domain/auth/OAuth/Errors";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthorizationRequest as DatabaseRequest } from "@infrastructure/database/entities/authorization-request.entity";
import { assertFound } from "@infrastructure/repositories/AssertFound";

@Injectable()
export class RequestDomainRepository implements RequestInterface {
  constructor(
    @InjectRepository(DatabaseRequest)
    private readonly requestRepository: Repository<DatabaseRequest>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async persist(authorizationRequest: DomainRequest): Promise<void> {
    const databaseRequest = this.mapToDatabase(authorizationRequest);
    await this.requestRepository.save(databaseRequest);
  }

  async retrieve(id: IdentityValue): Promise<DomainRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: id.toString() },
    });

    assertFound(request, "Authorization request not found");

    return this.mapToDomain(request);
  }

  async useAuthorizationCodeAtomically(
    authorizationCode: string,
    clock: ClockInterface,
  ): Promise<DomainRequest> {
    const result = await this.requestRepository
      .createQueryBuilder()
      .setLock("pessimistic_write")
      .update(DatabaseRequest)
      .set({
        authorizationCode: () =>
          `jsonb_set("authorizationCode", '{used}', 'true')`,
      })
      .where("\"authorizationCode\"->>'code' = :code", {
        code: authorizationCode,
      })
      .andWhere("\"authorizationCode\"->>'used' = :used", { used: false })
      .andWhere("\"authorizationCode\"->>'exp' > :now", {
        now: clock.nowAsSecondsSinceEpoch(),
      })
      .returning("*")
      .execute();

    if (result.affected === 0) {
      throw new OauthInvalidCredentialsException({
        message: "Authorization code not found, already used, or expired",
      });
    }

    return this.mapToDomain((result.raw as DatabaseRequest[])[0]);
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
      authorizationCode: domainRequest.authorizationCode
        ? domainRequest.authorizationCode
        : null,
      intent: domainRequest.intent ? domainRequest.intent.toString() : null,
      resolution: domainRequest.resolution.toString(),
    };
  }
}
