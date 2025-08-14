import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { Repository } from "typeorm";

import { IdentityValue } from "@domain/IdentityValue";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";

import { AssignedDomainRepository } from "./Assigned.domain-repository";

describe("AssignedDomainRepository", () => {
  let repository: AssignedDomainRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, TypeOrmModule.forFeature([DatabaseUser])],
      providers: [AssignedDomainRepository],
    }).compile();

    repository = module.get<AssignedDomainRepository>(AssignedDomainRepository);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("retrieve", () => {
    it("should retrieve when user exists", async () => {
      // Arrange: insert a user directly via repository
      const typeormRepo = module.get<Repository<DatabaseUser>>(
        getRepositoryToken(DatabaseUser),
      );
      const assigned = assignedMother();
      await typeormRepo.save({
        id: assigned.identity.toString(),
        email: "assigned@example.com",
        emailVerified: false,
        password: "hash",
        refreshTokens: [],
      });

      // Act
      const result = await repository.retrieve(assigned.identity);

      // Assert
      expect(result.identity.toString()).toBe(assigned.identity.toString());
    });

    it("should throw when not found", async () => {
      const nonExistent = IdentityValue.create();
      await expect(repository.retrieve(nonExistent)).rejects.toThrow(
        "Assigned not found",
      );
    });
  });
});
