import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { RequestDomainRepositoryInMemory } from "./Request.domain-repository.in-memory";
import { IdentityValue } from "@domain/IdentityValue";
import { requestMother } from "@test/domain/authentication/Request.mother";
import { randomString } from "@test/utility/randomString";

describe("RequestDomainRepositoryInMemory", () => {
  let repository: RequestDomainRepositoryInMemory;

  beforeEach(() => {
    repository = new RequestDomainRepositoryInMemory();
  });

  describe("persist", () => {
    it("should save a request to memory", async () => {
      // Arrange
      const request = requestMother();

      // Act
      await repository.persist(request);

      // Assert
      expect(repository.requests.has(request.id.toString())).toBe(true);
      expect(repository.requests.get(request.id.toString())).toBe(request);
    });

    it("should overwrite existing request with same id", async () => {
      // Arrange
      const originalRequest = requestMother({
        state: "original-state",
      });
      await repository.persist(originalRequest);

      // Act - create new request with same id but different state
      const updatedRequest = requestMother({
        id: originalRequest.id, // Same id
        state: "updated-state", // Different state
      });
      await repository.persist(updatedRequest);

      // Assert
      expect(repository.requests.get(originalRequest.id.toString())).toBe(
        updatedRequest,
      );
      expect(
        repository.requests.get(originalRequest.id.toString())?.state,
      ).toBe("updated-state");
    });
  });

  describe("retrieve", () => {
    it("should retrieve request by id", async () => {
      // Arrange
      const request = requestMother();
      await repository.persist(request);

      // Act
      const result = await repository.retrieve(request.id);

      // Assert
      expect(result).toBe(request);
      expect(result.id.toString()).toBe(request.id.toString());
      expect(result.state).toBe(request.state);
    });

    it("should reject when request not found by id", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Authorization request not found",
      );
    });

    it("should handle multiple requests correctly", async () => {
      // Arrange
      const request1 = requestMother({ state: "state-1" });
      const request2 = requestMother({ state: "state-2" });
      await repository.persist(request1);
      await repository.persist(request2);

      // Act
      const retrievedRequest1 = await repository.retrieve(request1.id);
      const retrievedRequest2 = await repository.retrieve(request2.id);

      // Assert
      expect(retrievedRequest1.state).toBe("state-1");
      expect(retrievedRequest2.state).toBe("state-2");
      expect(repository.requests.size).toBe(2);
    });
  });

  describe("getByAuthorizationCode", () => {
    it("should retrieve request by authorization code", async () => {
      // Arrange
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromUnknown({
          code: authCode,
          sub: IdentityValue.create().toString(),
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
          used: false,
        }),
      });
      await repository.persist(request);

      // Act
      const result = await repository.getByAuthorizationCode(authCode);

      // Assert
      expect(result).toBe(request);
      expect(result.id.toString()).toBe(request.id.toString());
    });

    it("should throw error when authorization code not found", async () => {
      // Arrange
      const nonExistentCode = "non-existent-code";

      // Act & Assert
      await expect(
        repository.getByAuthorizationCode(nonExistentCode),
      ).rejects.toThrow("Authorization request not found");
    });
  });

  describe("requests map", () => {
    it("should be initially empty", () => {
      // Assert
      expect(repository.requests.size).toBe(0);
    });

    it("should be accessible for external inspection", async () => {
      // Arrange
      const request = requestMother();

      // Act
      await repository.persist(request);

      // Assert
      expect(repository.requests).toBeInstanceOf(Map);
      expect(repository.requests.size).toBe(1);
    });
  });
});
