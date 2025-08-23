import { requestMother } from "@test/domain/authentication/Request.mother";
import { randomString } from "@test/utility/randomString";

import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { Request as DomainRequest } from "@domain/auth/OAuth/Authorization/Request";
import { IdentityValue } from "@domain/IdentityValue";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { RequestDomainRepositoryInMemory } from "@infrastructure/repositories/domain";

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
      expect(repository.requests.get(request.id.toString())).toStrictEqual(
        request,
      );
      expect(repository.requests.get(request.id.toString())).not.toBe(request);
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
      const result = repository.requests.get(originalRequest.id.toString());

      // Assert
      expect(result).toStrictEqual(updatedRequest);
      expect(result).not.toBe(updatedRequest);
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
      expect(result).toStrictEqual(request);
      expect(result).not.toBe(request);
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

  describe("useAuthorizationCodeAtomically", () => {
    it("should successfully use authorization code and return updated request", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() + 3600,
          issued: clock.nowAsSecondsSinceEpoch(),
          exchange: null, // not used
        }),
      });
      await repository.persist(request);

      // Act
      const result = await repository.useAuthorizationCodeAtomically(
        authCode,
        clock,
      );

      // Assert
      expect(result).toBeInstanceOf(DomainRequest);
      expect(result.id.toString()).toBe(request.id.toString());
      expect(result.authorizationCode).not.toBeNull();
      expect(result.authorizationCode?.exchange).not.toBe(null);
      expect(result.authorizationCode?.code).toBe(authCode);

      // Verify the code is actually marked as used in storage
      const storedRequest = repository.requests.get(request.id.toString());
      expect(storedRequest?.authorizationCode?.exchange).not.toBe(null);
    });

    it("should throw error when authorization code does not exist", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const nonExistentCode = "non-existent-authorization-code";

      // Act & Assert
      await expect(
        repository.useAuthorizationCodeAtomically(nonExistentCode, clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should throw error when authorization code is already used", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() + 3600,
          issued: clock.nowAsSecondsSinceEpoch(),
          exchange: clock.nowAsSecondsSinceEpoch() + 1800, // Already used
        }),
      });
      await repository.persist(request);

      // Act & Assert
      await expect(
        repository.useAuthorizationCodeAtomically(authCode, clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should throw error when authorization code is expired", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() - 1, // Expired
          issued: clock.nowAsSecondsSinceEpoch() - 3600,
          exchange: null, // not used
        }),
      });
      await repository.persist(request);

      // Act & Assert
      await expect(
        repository.useAuthorizationCodeAtomically(authCode, clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should throw error when request has no authorization code", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const request = requestMother(); // No authorization code
      await repository.persist(request);

      // Act & Assert
      await expect(
        repository.useAuthorizationCodeAtomically("some-code", clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should handle concurrent requests and prevent race conditions", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() + 3600,
          issued: clock.nowAsSecondsSinceEpoch(),
          exchange: null, // not used
        }),
      });
      await repository.persist(request);

      // Act - Execute two concurrent requests
      const [result1, result2] = await Promise.allSettled([
        repository.useAuthorizationCodeAtomically(authCode, clock),
        repository.useAuthorizationCodeAtomically(authCode, clock),
      ]);

      // Assert - One should succeed, one should fail
      expect(result1.status).not.toBe(result2.status);

      const successResult = result1.status === "fulfilled" ? result1 : result2;
      const failureResult = result1.status === "rejected" ? result1 : result2;

      expect(successResult.status).toBe("fulfilled");
      expect(failureResult.status).toBe("rejected");
      if (failureResult.status === "rejected") {
        expect((failureResult.reason as Error).message).toContain(
          "Authorization code not found, already used, or expired",
        );
      }

      // Verify the successful result has the code marked as used
      if (successResult.status === "fulfilled") {
        expect(successResult.value.authorizationCode?.exchange).not.toBe(null);
      }

      // Verify only one request was processed
      const storedRequest = repository.requests.get(request.id.toString());
      expect(storedRequest?.authorizationCode?.exchange).not.toBe(null);
    });

    it("should return request with all properties intact after atomic update", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() + 3600,
          issued: clock.nowAsSecondsSinceEpoch(),
          exchange: null, // not used
        }),
      });
      await repository.persist(request);

      // Act
      const result = await repository.useAuthorizationCodeAtomically(
        authCode,
        clock,
      );

      // Assert - All original properties should be preserved
      expect(result.id.toString()).toBe(request.id.toString());
      expect(result.clientId.toString()).toBe(request.clientId.toString());
      expect(result.redirectUri.toString()).toBe(
        request.redirectUri.toString(),
      );
      expect(result.state).toBe(request.state);
      expect(result.codeChallenge).toBe(request.codeChallenge);
      expect(result.scope.toString()).toEqual(request.scope.toString());
      expect(result.responseType.toString()).toBe(
        request.responseType.toString(),
      );
      expect(result.codeChallengeMethod.toString()).toBe(
        request.codeChallengeMethod.toString(),
      );

      // Only the authorization code should be updated
      expect(result.authorizationCode?.exchange).not.toBe(null);
      expect(result.authorizationCode?.code).toBe(authCode);
    });

    it("should not mutate the original request object", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCode = randomString();
      const request = requestMother({
        authorizationCode: Code.fromDatabase({
          code: authCode,
          subject: IdentityValue.create().toString(),
          expires: clock.nowAsSecondsSinceEpoch() + 3600,
          issued: clock.nowAsSecondsSinceEpoch(),
          exchange: null, // not used
        }),
      });
      await repository.persist(request);

      // Act
      const result = await repository.useAuthorizationCodeAtomically(
        authCode,
        clock,
      );

      // Assert - The returned object should be different from the original
      expect(result).not.toBe(request);
      expect(result.authorizationCode).not.toBe(request.authorizationCode);
      expect(result.authorizationCode?.exchange).not.toBe(null);

      // The stored request should be updated
      const storedRequest = repository.requests.get(request.id.toString());
      expect(storedRequest?.authorizationCode?.exchange).not.toBe(null);
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
