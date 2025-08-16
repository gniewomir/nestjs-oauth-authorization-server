import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication/User.mother";
import { DataSource } from "typeorm";

import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";

/**
 * Correct results only when database is completely empty
 */
describe.skip("TypeOrm+Postgres upsert limitations", () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([DatabaseUser]),
      ],
      providers: [],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it("should demonstrate working upsert for single conflict path", async () => {
    const repo = dataSource.getRepository(DatabaseUser);
    const count = await repo.count();
    expect(count).toBe(0);

    const userDomainFixture = userMother();
    const userDatabaseFixture = {
      id: userDomainFixture.identity.toString(),
      email: userDomainFixture.email.toString(),
      emailVerified: userDomainFixture.emailVerified,
      password: userDomainFixture.password,
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies DatabaseUser;
    await repo.upsert(userDatabaseFixture, { conflictPaths: ["id"] });

    const newCount = await repo.count();
    expect(newCount).toBe(1);
  });

  it("should demonstrate not working upsert for multiple conflict paths", async () => {
    await expect(async () => {
      const repo = dataSource.getRepository(DatabaseUser);
      const count = await repo.count();
      expect(count).toBe(0);

      const userDomainFixture = userMother();
      const userDatabaseFixture = {
        id: userDomainFixture.identity.toString(),
        email: userDomainFixture.email.toString(),
        emailVerified: userDomainFixture.emailVerified,
        password: userDomainFixture.password,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies DatabaseUser;
      await repo.upsert(userDatabaseFixture, {
        conflictPaths: ["id", "email"],
      });

      const newCount = await repo.count();
      expect(newCount).toBe(1);
    }).rejects.toThrow(
      "there is no unique or exclusion constraint matching the ON CONFLICT specification",
    );
  });
});
