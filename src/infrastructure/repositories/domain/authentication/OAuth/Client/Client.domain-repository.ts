import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Client } from "@domain/authentication/OAuth/Client/Client";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { OauthClient as DatabaseClient } from "@infrastructure/database/entities/oauth-client.entity";

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

    if (!client) {
      throw new Error("Client not found");
    }

    return this.mapToDomain(client);
  }

  private mapToDomain(databaseClient: DatabaseClient): Client {
    return new Client({
      id: IdentityValue.fromString(databaseClient.id),
      name: databaseClient.name,
    });
  }

  private mapToDatabase(domainClient: Client): DatabaseClient {
    const databaseClient = new DatabaseClient();
    databaseClient.id = domainClient.id.toString();
    databaseClient.name = domainClient.name;
    return databaseClient;
  }
}
