import { clientMother } from "@test/domain/authentication/Client.mother";

import { IdentityValue } from "@domain/IdentityValue";

import { ClientDomainRepositoryInMemory } from "./Client.domain-repository.in-memory";

describe("ClientDomainRepositoryInMemory", () => {
  let repository: ClientDomainRepositoryInMemory;

  beforeEach(() => {
    repository = new ClientDomainRepositoryInMemory();
  });

  describe("persist", () => {
    it("should save a client to memory", async () => {
      // Arrange
      const client = clientMother({
        name: "test-client",
      });

      // Act
      await repository.persist(client);

      // Assert
      expect(repository.clients.has(client.id.toString())).toBe(true);
      expect(repository.clients.get(client.id.toString())).toBe(client);
    });

    it("should overwrite existing client with same id", async () => {
      // Arrange
      const originalClient = clientMother({
        name: "original-name",
      });
      await repository.persist(originalClient);

      // Act - create new client with same id but different name
      const updatedClient = clientMother({
        ...originalClient,
        id: originalClient.id, // Same id
        name: "updated-name", // Different name
      });

      await repository.persist(updatedClient);

      // Assert
      expect(repository.clients.get(originalClient.id.toString())).toBe(
        updatedClient,
      );
      expect(repository.clients.get(originalClient.id.toString())?.name).toBe(
        "updated-name",
      );
    });
  });

  describe("retrieve", () => {
    it("should retrieve client by id", async () => {
      // Arrange
      const client = clientMother({
        name: "retrieve-test-client",
      });
      await repository.persist(client);

      // Act
      const result = await repository.retrieve(client.id);

      // Assert
      expect(result).toBe(client);
      expect(result.id.toString()).toBe(client.id.toString());
      expect(result.name).toBe(client.name);
    });

    it("should throw error when client not found by id", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Client not found",
      );
    });

    it("should handle multiple clients correctly", async () => {
      // Arrange
      const client1 = clientMother({ name: "client-1" });
      const client2 = clientMother({ name: "client-2" });
      await repository.persist(client1);
      await repository.persist(client2);

      // Act
      const retrievedClient1 = await repository.retrieve(client1.id);
      const retrievedClient2 = await repository.retrieve(client2.id);

      // Assert
      expect(retrievedClient1.name).toBe("client-1");
      expect(retrievedClient2.name).toBe("client-2");
      expect(repository.clients.size).toBe(2);
    });
  });

  describe("clients map", () => {
    it("should be initially empty", () => {
      // Assert
      expect(repository.clients.size).toBe(0);
    });

    it("should be accessible for external inspection", async () => {
      // Arrange
      const client = clientMother();

      // Act
      await repository.persist(client);

      // Assert
      expect(repository.clients).toBeInstanceOf(Map);
      expect(repository.clients.size).toBe(1);
    });
  });
});
