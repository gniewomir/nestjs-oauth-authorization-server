import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { clientMother } from "@test/domain/authentication/Client.mother";

import { Client as DomainClient } from "@domain/authentication/OAuth/Client/Client";
import { IdentityValue } from "@domain/IdentityValue";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { OauthClient as DatabaseClient } from "@infrastructure/database/entities/oauth-client.entity";

import { ClientDomainRepository } from "./Client.domain-repository";

describe("ClientDomainRepository", () => {
  let repository: ClientDomainRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([DatabaseClient]),
      ],
      providers: [ClientDomainRepository],
    }).compile();

    repository = module.get<ClientDomainRepository>(ClientDomainRepository);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("persist", () => {
    it("should save a new client to database", async () => {
      // Arrange
      const domainClient = clientMother({
        name: "test-client",
      });

      // Act
      await repository.persist(domainClient);

      // Assert - verify client was saved by retrieving it
      const savedClient = await repository.retrieve(domainClient.id);
      expect(savedClient.id.toString()).toBe(domainClient.id.toString());
      expect(savedClient.name).toBe(domainClient.name);
    });

    it("should update existing client when persisting with same id", async () => {
      // Arrange
      const originalClient = clientMother({
        name: "original-name",
      });
      await repository.persist(originalClient);

      // Act - create updated client with same id
      const updatedClient = clientMother({
        ...originalClient,
        id: originalClient.id, // Same id
        name: "updated-name", // Changed property
      });

      await repository.persist(updatedClient);

      // Assert
      const retrievedClient = await repository.retrieve(originalClient.id);
      expect(retrievedClient.name).toBe("updated-name");
    });
  });

  describe("retrieve", () => {
    it("should retrieve client by id", async () => {
      // Arrange
      const domainClient = clientMother({
        name: "retrieve-test-client",
      });
      await repository.persist(domainClient);

      // Act
      const result = await repository.retrieve(domainClient.id);

      // Assert
      expect(result).toBeInstanceOf(DomainClient);
      expect(result.id.toString()).toBe(domainClient.id.toString());
      expect(result.name).toBe(domainClient.name);
    });

    it("should throw error when client not found by id", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Client not found",
      );
    });
  });
});
