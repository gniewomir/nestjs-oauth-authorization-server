import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication/User.mother";

import { NumericDateValue } from "@domain/authentication/OAuth/NumericDateValue";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { RefreshTokenValue } from "@domain/authentication/OAuth/User/RefreshTokenValue";
import { User as DomainUser } from "@domain/authentication/OAuth/User/User";
import { IdentityValue } from "@domain/IdentityValue";
import { ONE_DAY_IN_SECONDS } from "@infrastructure/clock";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";

import { UserDomainRepository } from "./User.domain-repository";

describe("UserDomainRepository", () => {
  let repository: UserDomainRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([DatabaseUser]),
      ],
      providers: [UserDomainRepository],
    }).compile();

    repository = module.get<UserDomainRepository>(UserDomainRepository);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("getByEmail", () => {
    it("should return a user when found by email", async () => {
      // Arrange
      const email = EmailValue.fromString("test@example.com");
      const domainUser = userMother({ email });
      await repository.persist(domainUser);

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(result).toBeInstanceOf(DomainUser);
      expect(result.identity.toString()).toBe(domainUser.identity.toString());
      expect(result.email.toString()).toBe(domainUser.email.toString());
      expect(result.emailVerified).toBe(domainUser.emailVerified);
      expect(result.password).toBe(domainUser.password);
      expect(result.refreshTokens).toEqual(domainUser.refreshTokens);
    });

    it("should throw error when user not found by email", async () => {
      // Arrange
      const nonExistentEmail = EmailValue.fromString("nonexistent@example.com");

      // Act & Assert
      await expect(repository.getByEmail(nonExistentEmail)).rejects.toThrow(
        "User not found",
      );
    });

    it("should return user with refresh tokens", async () => {
      // Arrange
      const clock = new ClockServiceFake();
      const refreshToken = RefreshTokenValue.fromUnknown({
        jti: IdentityValue.create().toString(),
        exp: NumericDateValue.fromNumber(
          clock.nowAsSecondsSinceEpoch() + ONE_DAY_IN_SECONDS,
        ).toNumber(),
        aud: IdentityValue.create().toString(),
      });

      const email = EmailValue.fromString("user.with.tokens@example.com");
      const domainUser = userMother({
        email,
        refreshTokens: [refreshToken],
      });

      await repository.persist(domainUser);

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(result.refreshTokens).toHaveLength(1);
      expect(result.refreshTokens[0].jti).toBe(refreshToken.jti);
      expect(result.refreshTokens[0].exp).toBe(refreshToken.exp);
      expect(result.refreshTokens[0].aud).toBe(refreshToken.aud);
    });
  });

  describe("persist", () => {
    it("should save a new user to database", async () => {
      // Arrange
      const domainUser = userMother({
        email: EmailValue.fromString("new.user@example.com"),
        emailVerified: true,
      });

      // Act
      await repository.persist(domainUser);

      // Assert - verify user was saved by retrieving it
      const savedUser = await repository.retrieve(domainUser.identity);
      expect(savedUser.identity.toString()).toBe(
        domainUser.identity.toString(),
      );
      expect(savedUser.email.toString()).toBe(domainUser.email.toString());
      expect(savedUser.emailVerified).toBe(true);
      expect(savedUser.password).toBe(domainUser.password);
      expect(savedUser.refreshTokens).toEqual(domainUser.refreshTokens);
    });

    it("should update existing user when persisting with same identity", async () => {
      // Arrange
      const originalUser = userMother({
        emailVerified: false,
        email: EmailValue.fromString("update.test@example.com"),
      });
      await repository.persist(originalUser);

      // Act - create updated user with same identity
      const updatedUser = new DomainUser({
        identity: originalUser.identity, // Same identity
        email: originalUser.email,
        password: "new-password-hash",
        refreshTokens: originalUser.refreshTokens,
        emailVerified: true, // Changed property
      });
      await repository.persist(updatedUser);

      // Assert
      const retrievedUser = await repository.retrieve(originalUser.identity);
      expect(retrievedUser.emailVerified).toBe(true);
      expect(retrievedUser.password).toBe("new-password-hash");
    });
  });

  describe("retrieve", () => {
    it("should retrieve user by identity", async () => {
      // Arrange
      const domainUser = userMother({
        email: EmailValue.fromString("retrieve.test@example.com"),
        emailVerified: true,
      });
      await repository.persist(domainUser);

      // Act
      const result = await repository.retrieve(domainUser.identity);

      // Assert
      expect(result.identity.toString()).toBe(domainUser.identity.toString());
      expect(result.email.toString()).toBe(domainUser.email.toString());
      expect(result.emailVerified).toBe(domainUser.emailVerified);
      expect(result.password).toBe(domainUser.password);
      expect(result.refreshTokens).toEqual(domainUser.refreshTokens);
    });

    it("should throw error when user not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("countByEmail", () => {
    it("should return 0 when no users exist with email", async () => {
      // Arrange
      const email = EmailValue.fromString("nonexistent@example.com");

      // Act
      const count = await repository.countByEmail(email);

      // Assert
      expect(count).toBe(0);
    });

    it("should return 1 when one user exists with email", async () => {
      // Arrange
      const email = EmailValue.fromString("count.test@example.com");
      const domainUser = userMother({ email });
      await repository.persist(domainUser);

      // Act
      const count = await repository.countByEmail(email);

      // Assert
      expect(count).toBe(1);
    });
  });
});
