import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationsWithUser1755199334929 implements MigrationInterface {
  name = "AddRelationsWithUser1755199334929";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "context"
      ADD CONSTRAINT "FK_0322101a7b8da74eec6ed00cfe4" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "goal"
      ADD CONSTRAINT "FK_40bd308ea814964cec7146c6dce" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "goal"
      DROP CONSTRAINT "FK_40bd308ea814964cec7146c6dce"`);
    await queryRunner.query(`ALTER TABLE "context"
      DROP CONSTRAINT "FK_0322101a7b8da74eec6ed00cfe4"`);
  }
}
