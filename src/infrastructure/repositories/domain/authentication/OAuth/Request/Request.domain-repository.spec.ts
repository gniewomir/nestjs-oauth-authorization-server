import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { requestMother } from "@test/domain/authentication/Request.mother";

import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { Request as DomainAuthorizationRequest } from "@domain/authentication/OAuth/Authorization/Request";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthorizationCodeService } from "@infrastructure/authentication/authorization-code/authorization-code.service";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { ConfigModule } from "@infrastructure/config";
import { authConfigDefaults } from "@infrastructure/config/configs/auth.config";
import { DatabaseModule } from "@infrastructure/database";
import { AuthorizationRequest as DatabaseAuthorizationRequest } from "@infrastructure/database/entities";

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
      expect(savedRequest.scope).toEqual(domainRequest.scope);
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
      const authConfig = authConfigDefaults;

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
      expect(result.scope).toEqual(domainRequest.scope);
      expect(result.authorizationCode).toBeNull();
    });

    it("should throw error when OAuth request not found by id", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Authorization request not found",
      );
    });
  });

  describe("getByAuthorizationCode", () => {
    it("should return authorization request when found by authorization code", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const authCodeService = new AuthorizationCodeService();
      const authConfig = authConfigDefaults;

      const userId = IdentityValue.create();
      const authCode = Code.create(userId, authCodeService, clock, authConfig);

      const domainRequest = requestMother({
        authorizationCode: authCode,
      });
      await repository.persist(domainRequest);

      // Act
      const result = await repository.getByAuthorizationCode(authCode.code);

      // Assert
      expect(result).toBeInstanceOf(DomainAuthorizationRequest);
      expect(result.id.toString()).toBe(domainRequest.id.toString());
      expect(result.authorizationCode?.code).toBe(authCode.code);
    });

    it("should throw error when OAuth request not found by authorization code", async () => {
      // Arrange
      const nonExistentCode = "non-existent-code";

      // Act & Assert
      await expect(
        repository.getByAuthorizationCode(nonExistentCode),
      ).rejects.toThrow("Authorization request not found");
    });

    it("should throw error when searching for authorization code on request without one", async () => {
      // Arrange
      const domainRequest = requestMother(); // No authorization code
      await repository.persist(domainRequest);

      // Act & Assert
      await expect(
        repository.getByAuthorizationCode("some-code"),
      ).rejects.toThrow("Authorization request not found");
    });
  });
});
