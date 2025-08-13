import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";
import { userMother } from "@test/domain/authentication/User.mother";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { UserDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/User";

describe("transactional test isolation", () => {
  let repository: UserDomainRepository;
  let module: TestingModule;
  let dataSource: DataSource;

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
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it("should start each test with clean database state", async () => {
    const userRepo = dataSource.getRepository(DatabaseUser);
    const count = await userRepo.count();
    expect(count).toBe(0);
  });

  it("should pollute database during test and rollback after", async () => {
    const userRepo = dataSource.getRepository(DatabaseUser);
    const count = await userRepo.count();
    expect(count).toBe(0);

    const user = userMother();
    await repository.persist(user);

    const finalCount = await userRepo.count();
    expect(finalCount).toBe(1);
  });

  it("should allow for nested transactions", async () => {
    await dataSource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(DatabaseUser);
      const count = await repo.count();
      expect(count).toBe(0);

      const userFixture = userMother();
      await repo.upsert(
        {
          id: userFixture.identity.toString(),
          email: userFixture.email.toString(),
          emailVerified: userFixture.emailVerified,
          password: userFixture.password,
          refreshTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies DatabaseUser,
        ["id"],
      );

      await dataSource.transaction(async (entityManager) => {
        const repo = entityManager.getRepository(DatabaseUser);
        const userFixture = userMother();
        await repo.upsert(
          {
            id: userFixture.identity.toString(),
            email: userFixture.email.toString(),
            emailVerified: userFixture.emailVerified,
            password: userFixture.password,
            refreshTokens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          } satisfies DatabaseUser,
          ["id"],
        );
      });

      const newCount = await repo.count();
      expect(newCount).toBe(2);
    });
  });

  it("should demonstrate perfect isolation", async () => {
    const userRepo = dataSource.getRepository(DatabaseUser);
    const count = await userRepo.count();

    // previous tests written to the database, but afterward it is still clean
    expect(count).toBe(0);
  });
});
