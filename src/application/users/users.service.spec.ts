import { Test, TestingModule } from "@nestjs/testing";

import { PasswordInterfaceSymbol } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { User } from "@domain/auth/OAuth/User/User";
import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { UserDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository.in-memory";
import { PasswordServiceFake } from "@infrastructure/security/password/password.service.fake";

import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let users: UserDomainRepositoryInMemory;
  let passwords: PasswordServiceFake;

  beforeEach(async () => {
    users = new UserDomainRepositoryInMemory();
    passwords = new PasswordServiceFake();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersInterfaceSymbol,
          useValue: users,
        },
        {
          provide: PasswordInterfaceSymbol,
          useValue: passwords,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const result = await service.register({
        email: "test@example.com",
        password: "validPassword123",
      });

      expect(result.userId).toBeDefined();
      expect(result.email).toBe("test@example.com");
      expect(result.emailVerified).toBe(false);

      // Verify user was persisted
      expect(users.users.size).toBe(1);
      const persistedUser = users.users.get(result.userId);
      expect(persistedUser).toBeInstanceOf(User);
      expect(persistedUser?.email.toString()).toBe("test@example.com");
    });

    it("should throw error when email already exists", async () => {
      // First registration
      await service.register({
        email: "test@example.com",
        password: "validPassword123",
      });

      // Second registration with same email should fail
      await expect(
        service.register({
          email: "test@example.com",
          password: "validPassword123",
        }),
      ).rejects.toThrow("User email must be unique");

      // Verify only one user was created
      expect(users.users.size).toBe(1);
    });

    it("should create user with unique identity", async () => {
      const result1 = await service.register({
        email: "test@example.com",
        password: "validPassword123",
      });

      const result2 = await service.register({
        email: "test2@example.com",
        password: "validPassword123",
      });

      expect(result1.userId).not.toBe(result2.userId);
      expect(users.users.size).toBe(2);
    });
  });

  describe("show", () => {
    it("should return user details for existing user", async () => {
      const registeredUser = await service.register({
        email: "test@example.com",
        password: "validPassword123",
      });

      const result = await service.show({ userId: registeredUser.userId });

      expect(result.userId).toBe(registeredUser.userId);
      expect(result.email).toBe("test@example.com");
      expect(result.emailVerified).toBe(false);
    });

    it("should throw error when user does not exist", async () => {
      const nonExistentUserId = IdentityValue.create().toString();

      await expect(service.show({ userId: nonExistentUserId })).rejects.toThrow(
        `User with ID ${nonExistentUserId} not found`,
      );
    });
  });
});
