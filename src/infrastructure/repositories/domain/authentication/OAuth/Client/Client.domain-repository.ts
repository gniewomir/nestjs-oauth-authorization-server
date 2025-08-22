import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  Client,
  ClientInterface,
  RedirectUriValue,
} from "@domain/auth/OAuth/Client";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import { IdentityValue } from "@domain/IdentityValue";
import { OauthClient as DatabaseClient } from "@infrastructure/database/entities/oauth-client.entity";
import { AssertFound } from "@infrastructure/repositories/AssertFound";

@Injectable()
export class ClientDomainRepository implements ClientInterface {
  constructor(
    @InjectRepository(DatabaseClient)
    private readonly clientRepository: Repository<DatabaseClient>,
  ) {}

  async persist(client: Client): Promise<void> {
    const databaseClient = this.mapToDatabase(client);
    await this.clientRepository.save(databaseClient);
  }

  async retrieve(id: IdentityValue): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id: id.toString() },
    });

    AssertFound(client, "Client not found");

    return this.mapToDomain(client);
  }

  private mapToDomain(databaseClient: DatabaseClient): Client {
    return new Client({
      id: IdentityValue.fromString(databaseClient.id),
      name: databaseClient.name,
      scope: ScopeValueImmutableSet.fromString(databaseClient.scope),
      redirectUri: RedirectUriValue.fromString(databaseClient.redirectUri),
      registration: databaseClient.registration,
    });
  }

  private mapToDatabase(domainClient: Client) {
    return {
      id: domainClient.id.toString(),
      name: domainClient.name,
      scope: domainClient.scope.toString(),
      redirectUri: domainClient.redirectUri.toString(),
      registration: domainClient.registration,
    } satisfies Omit<DatabaseClient, "createdAt" | "updatedAt">;
  }
}
