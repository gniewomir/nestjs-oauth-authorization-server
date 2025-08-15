import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { User } from "@domain/authentication/OAuth/User/User";
import { UserFacade } from "@domain/authentication/User.facade";
import { IdentityValue } from "@domain/IdentityValue";
import { UserDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.in-memory";
import { PasswordServiceFake } from "@infrastructure/security/password/password.service.fake";

describe("UserFacade", () => {
  describe("register", () => {
    let users: UserDomainRepositoryInMemory;
    let passwords: PasswordServiceFake;
    let email: EmailValue;
    let password: PasswordValue;

    beforeEach(() => {
      email = EmailValue.fromString("test@example.com");
      password = PasswordValue.fromString("validPassword123");
      users = new UserDomainRepositoryInMemory();
      passwords = new PasswordServiceFake();
    });

    it("should successfully register a new user", async () => {
      const result = await UserFacade.register(
        { email, password },
        users,
        passwords,
      );

      expect(result.user).toBeInstanceOf(User);
      expect(result.identity).toBeInstanceOf(IdentityValue);
      expect(result.user.email.isEqual(email)).toBe(true);
      expect(result.user.emailVerified).toBe(false);
      expect(result.user.refreshTokens).toEqual([]);

      // Verify user was persisted
      expect(users.users.size).toBe(1);
      const persistedUser = users.users.get(result.identity.toString());
      expect(persistedUser).toBeInstanceOf(User);
      expect(persistedUser?.email.isEqual(email)).toBe(true);

      // Verify password was hashed
      const hashedPassword = await passwords.hashPlaintextPassword(
        password.toString(),
      );
      expect(persistedUser?.password).toBe(hashedPassword);
    });

    it("should throw error when email already exists", async () => {
      // First registration
      await UserFacade.register({ email, password }, users, passwords);

      // Second registration with same email should fail
      await expect(
        UserFacade.register({ email, password }, users, passwords),
      ).rejects.toThrow("User email must be unique");

      // Verify only one user was created
      expect(users.users.size).toBe(1);
    });

    it("should create user with unique identity", async () => {
      const result1 = await UserFacade.register(
        { email, password },
        users,
        passwords,
      );

      const email2 = EmailValue.fromString("test2@example.com");
      const result2 = await UserFacade.register(
        { email: email2, password },
        users,
        passwords,
      );

      expect(result1.identity.toString()).not.toBe(result2.identity.toString());
      expect(users.users.size).toBe(2);
    });

    it("should validate email uniqueness before creating user", async () => {
      // First registration
      await UserFacade.register({ email, password }, users, passwords);

      // Try to register again with same email
      await expect(
        UserFacade.register({ email, password }, users, passwords),
      ).rejects.toThrow("User email must be unique");

      // Verify only one user exists
      expect(users.users.size).toBe(1);
    });

    it("should handle multiple users with different emails", async () => {
      const email1 = EmailValue.fromString("user1@example.com");
      const email2 = EmailValue.fromString("user2@example.com");
      const email3 = EmailValue.fromString("user3@example.com");

      const result1 = await UserFacade.register(
        { email: email1, password },
        users,
        passwords,
      );
      const result2 = await UserFacade.register(
        { email: email2, password },
        users,
        passwords,
      );
      const result3 = await UserFacade.register(
        { email: email3, password },
        users,
        passwords,
      );

      expect(users.users.size).toBe(3);
      expect(result1.identity.toString()).not.toBe(result2.identity.toString());
      expect(result2.identity.toString()).not.toBe(result3.identity.toString());
      expect(result1.identity.toString()).not.toBe(result3.identity.toString());
    });
  });
});
