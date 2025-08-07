import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1754550908202 implements MigrationInterface {
  name = "Initial1754550908202";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user"
                             (
                               "id"        uuid      NOT NULL,
                               "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                               "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                               CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`CREATE TABLE "goal"
                             (
                               "id"            uuid      NOT NULL,
                               "ordinalNumber" bigint    NOT NULL,
                               "description"   text      NOT NULL,
                               "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               CONSTRAINT "UQ_fea8eabb844124b981085876881" UNIQUE ("ordinalNumber"),
                               CONSTRAINT "PK_88c8e2b461b711336c836b1e130" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`CREATE TABLE "context"
                             (
                               "id"            uuid      NOT NULL,
                               "ordinalNumber" bigint    NOT NULL,
                               "description"   text      NOT NULL,
                               "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               CONSTRAINT "UQ_fe281d24b737e6c74e10538a992" UNIQUE ("ordinalNumber"),
                               CONSTRAINT "PK_d1ff50573dd9c6c1d0896805701" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`CREATE TABLE "task"
                             (
                               "id"            uuid      NOT NULL,
                               "ordinalNumber" bigint    NOT NULL,
                               "description"   text      NOT NULL,
                               "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
                               "goalId"        uuid      NOT NULL,
                               "contextId"     uuid      NOT NULL,
                               "userId"        uuid      NOT NULL,
                               CONSTRAINT "UQ_ee31038ea78470491f3b3f8382b" UNIQUE ("ordinalNumber"),
                               CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`ALTER TABLE "task"
      ADD CONSTRAINT "FK_266bc4eb256aee41118272eccf3" FOREIGN KEY ("goalId") REFERENCES "goal" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task"
      ADD CONSTRAINT "FK_3cfe74a87c3c74b320ca95574e4" FOREIGN KEY ("contextId") REFERENCES "context" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task"
      ADD CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task"
      DROP CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9"`);
    await queryRunner.query(`ALTER TABLE "task"
      DROP CONSTRAINT "FK_3cfe74a87c3c74b320ca95574e4"`);
    await queryRunner.query(`ALTER TABLE "task"
      DROP CONSTRAINT "FK_266bc4eb256aee41118272eccf3"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TABLE "context"`);
    await queryRunner.query(`DROP TABLE "goal"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
