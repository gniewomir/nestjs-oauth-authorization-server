import { UserDomainRepositoryInMemory } from "./User.domain-repository.in-memory";
import { IdentityValue } from "@domain/IdentityValue";
import { userMother } from "@test/domain/authentication/User.mother";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";

describe("UserDomainRepositoryInMemory", () => {
  let repository: UserDomainRepositoryInMemory;

  beforeEach(() => {
    repository = new UserDomainRepositoryInMemory();
  });

  describe("persist", () => {
    it("should save a user to memory", async () => {
      // Arrange
      const user = userMother();

      // Act
      await repository.persist(user);

      // Assert
      expect(repository.users.has(user.identity.toString())).toBe(true);
      expect(repository.users.get(user.identity.toString())).toBe(user);
    });

    it("should overwrite existing user with same identity", async () => {
      // Arrange
      const originalUser = userMother({
        emailVerified: false,
      });
      await repository.persist(originalUser);

      // Act - create new user with same identity but different email verification
      const updatedUser = userMother({
        identity: originalUser.identity, // Same identity
        emailVerified: true, // Different verification status
      });
      await repository.persist(updatedUser);

      // Assert
      expect(repository.users.get(originalUser.identity.toString())).toBe(
        updatedUser,
      );
      expect(
        repository.users.get(originalUser.identity.toString())?.emailVerified,
      ).toBe(true);
    });
  });

  describe("retrieve", () => {
    it("should retrieve user by identity", async () => {
      // Arrange
      const user = userMother();
      await repository.persist(user);

      // Act
      const result = await repository.retrieve(user.identity);

      // Assert
      expect(result).toBe(user);
      expect(result.identity.toString()).toBe(user.identity.toString());
      expect(result.email.toString()).toBe(user.email.toString());
    });

    it("should reject when user not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "User not found",
      );
    });

    it("should handle multiple users correctly", async () => {
      // Arrange
      const user1 = userMother({ emailVerified: true });
      const user2 = userMother({ emailVerified: false });
      await repository.persist(user1);
      await repository.persist(user2);

      // Act
      const retrievedUser1 = await repository.retrieve(user1.identity);
      const retrievedUser2 = await repository.retrieve(user2.identity);

      // Assert
      expect(retrievedUser1.emailVerified).toBe(true);
      expect(retrievedUser2.emailVerified).toBe(false);
      expect(repository.users.size).toBe(2);
    });
  });

  describe("getByEmail", () => {
    it("should retrieve user by email", async () => {
      // Arrange
      const email = EmailValue.fromString("test@example.com");
      const user = userMother({ email });
      await repository.persist(user);

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(result).toBe(user);
      expect(result.email.isEqual(email)).toBe(true);
    });

    it("should throw error when user not found by email", async () => {
      // Arrange
      const nonExistentEmail = EmailValue.fromString("nonexistent@example.com");

      // Act & Assert
      await expect(repository.getByEmail(nonExistentEmail)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("countByEmail", () => {
    it("should return 0 for non-existent email", async () => {
      // Arrange
      const email = EmailValue.fromString("nonexistent@example.com");

      // Act
      const count = await repository.countByEmail(email);

      // Assert
      expect(count).toBe(0);
    });

    it("should return 1 for existing email", async () => {
      // Arrange
      const email = EmailValue.fromString("test@example.com");
      const user = userMother({ email });
      await repository.persist(user);

      // Act
      const count = await repository.countByEmail(email);

      // Assert
      expect(count).toBe(1);
    });

    it("should return correct count for multiple users with same email", async () => {
      // Arrange
      const email = EmailValue.fromString("shared@example.com");
      const user1 = userMother({ email });
      const user2 = userMother({ email });
      await repository.persist(user1);
      await repository.persist(user2);

      // Act
      const count = await repository.countByEmail(email);

      // Assert
      expect(count).toBe(2);
    });
  });

  describe("users map", () => {
    it("should be initially empty", () => {
      // Assert
      expect(repository.users.size).toBe(0);
    });

    it("should be accessible for external inspection", async () => {
      // Arrange
      const user = userMother();

      // Act
      await repository.persist(user);

      // Assert
      expect(repository.users).toBeInstanceOf(Map);
      expect(repository.users.size).toBe(1);
    });
  });
});
