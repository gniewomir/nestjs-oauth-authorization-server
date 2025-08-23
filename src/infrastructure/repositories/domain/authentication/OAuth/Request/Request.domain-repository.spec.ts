import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { requestMother } from "@test/domain/authentication/Request.mother";

import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { Request as DomainAuthorizationRequest } from "@domain/auth/OAuth/Authorization/Request";
import { IdentityValue } from "@domain/IdentityValue";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { ConfigModule } from "@infrastructure/config";
import { AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";
import { DatabaseModule } from "@infrastructure/database";
import { AuthorizationRequest as DatabaseAuthorizationRequest } from "@infrastructure/database/entities";
import { AuthorizationCodeService } from "@infrastructure/security/authorization-code/authorization-code.service";

import { RequestDomainRepository } from "./Request.domain-repository";

describe("RequestDomainRepository", () => {
  let repository: RequestDomainRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([DatabaseAuthorizationRequest]),
      ],
      providers: [RequestDomainRepository],
    }).compile();

    repository = module.get<RequestDomainRepository>(RequestDomainRepository);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("persist", () => {
    it("should save a new authorization request to database", async () => {
      // Arrange
      const domainRequest = requestMother();

      // Act
      await repository.persist(domainRequest);

      // Assert - verify request was saved by retrieving it
      const savedRequest = await repository.retrieve(domainRequest.id);
      expect(savedRequest.id.toString()).toBe(domainRequest.id.toString());
      expect(savedRequest.clientId.toString()).toBe(
        domainRequest.clientId.toString(),
      );
      expect(savedRequest.redirectUri.toString()).toBe(
        domainRequest.redirectUri.toString(),
      );
      expect(savedRequest.state).toBe(domainRequest.state);
      expect(savedRequest.codeChallenge).toBe(domainRequest.codeChallenge);
      expect(savedRequest.scope.toString()).toEqual(
        domainRequest.scope.toString(),
      );
      expect(savedRequest.authorizationCode).toBeNull();
    });

    it("should update existing OAuth request when persisting with same id", async () => {
      // Arrange
      const originalRequest = requestMother();
      await repository.persist(originalRequest);

      // Act - create updated request with same id but different state
      const updatedRequest = requestMother({
        ...originalRequest,
        id: originalRequest.id, // Same id
        state: "updated-state", // Changed property
      });

      await repository.persist(updatedRequest);

      // Assert
      const retrievedRequest = await repository.retrieve(originalRequest.id);
      expect(retrievedRequest.state).toBe("updated-state");
    });

    it("should save OAuth request with authorization code", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });

      // Act
      await repository.persist(domainRequest);

      // Assert
      const savedRequest = await repository.retrieve(domainRequest.id);
      expect(savedRequest.authorizationCode).not.toBeNull();
      expect(savedRequest.authorizationCode?.sub.toString()).toBe(
        userId.toString(),
      );
      expect(savedRequest.authorizationCode?.code).toBe(authCode.code);
    });
  });

  describe("retrieve", () => {
    it("should retrieve OAuth request by id", async () => {
      // Arrange
      const domainRequest = requestMother();
      await repository.persist(domainRequest);

      // Act
      const result = await repository.retrieve(domainRequest.id);

      // Assert
      expect(result.id.toString()).toBe(domainRequest.id.toString());
      expect(result.clientId.toString()).toBe(
        domainRequest.clientId.toString(),
      );
      expect(result.redirectUri.toString()).toBe(
        domainRequest.redirectUri.toString(),
      );
      expect(result.state).toBe(domainRequest.state);
      expect(result.codeChallenge).toBe(domainRequest.codeChallenge);
      expect(result.scope.toString()).toEqual(domainRequest.scope.toString());
      expect(result.authorizationCode).toBeNull();
    });

    it("should throw error when request is not found by id", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Authorization request not found",
      );
    });
  });

  describe("useAuthorizationCodeAtomically", () => {
    it("should successfully use authorization code and return updated request", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // Act
      const result = await repository.useAuthorizationCodeAtomically(
        authCode.code,
        clock,
      );

      // Assert
      expect(result).toBeInstanceOf(DomainAuthorizationRequest);
      expect(result.id.toString()).toBe(domainRequest.id.toString());
      expect(result.authorizationCode).not.toBeNull();
      expect(result.authorizationCode?.used).toBe(true);
      expect(result.authorizationCode?.code).toBe(authCode.code);

      // Verify the code is actually marked as used in database
      const retrievedRequest = await repository.retrieve(result.id);
      expect(retrievedRequest.authorizationCode?.used).toBe(true);
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
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // First usage - should succeed
      await repository.useAuthorizationCodeAtomically(authCode.code, clock);

      // Act & Assert - Second usage should fail
      await expect(
        repository.useAuthorizationCodeAtomically(authCode.code, clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should throw error when authorization code is expired", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // Advance time beyond expiration
      clock.timeTravelSeconds(
        clock.nowAsSecondsSinceEpoch() +
          authConfig.oauthAuthorizationCodeExpirationSeconds +
          1,
      );

      // Act & Assert
      await expect(
        repository.useAuthorizationCodeAtomically(authCode.code, clock),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("should throw error when request has no authorization code", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const domainRequest = requestMother(); // No authorization code
      await repository.persist(domainRequest);

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
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // Act - Execute two concurrent requests
      const [result1, result2] = await Promise.allSettled([
        repository.useAuthorizationCodeAtomically(authCode.code, clock),
        repository.useAuthorizationCodeAtomically(authCode.code, clock),
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
        expect(successResult.value.authorizationCode?.used).toBe(true);
      }
    });

    it("should return request with all properties intact after atomic update", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCodeService = new AuthorizationCodeService();
      const authConfig = await plainToConfig(
        {},
        AuthConfig.defaults(),
        AuthConfig,
      );

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // Act
      const result = await repository.useAuthorizationCodeAtomically(
        authCode.code,
        clock,
      );

      // Assert - All original properties should be preserved
      expect(result.id.toString()).toBe(domainRequest.id.toString());
      expect(result.clientId.toString()).toBe(
        domainRequest.clientId.toString(),
      );
      expect(result.redirectUri.toString()).toBe(
        domainRequest.redirectUri.toString(),
      );
      expect(result.state).toBe(domainRequest.state);
      expect(result.codeChallenge).toBe(domainRequest.codeChallenge);
      expect(result.scope.toString()).toEqual(domainRequest.scope.toString());
      expect(result.responseType.toString()).toBe(
        domainRequest.responseType.toString(),
      );
      expect(result.codeChallengeMethod.toString()).toBe(
        domainRequest.codeChallengeMethod.toString(),
      );

      // Only the authorization code should be updated
      expect(result.authorizationCode?.used).toBe(true);
      expect(result.authorizationCode?.code).toBe(authCode.code);
      expect(result.authorizationCode?.sub.toString()).toBe(
        authCode.sub.toString(),
      );
    });
  });
});
