import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerToContextsAndGoals1755194186192
  implements MigrationInterface
{
  name = "AddOwnerToContextsAndGoals1755194186192";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "context"
      ADD "userId" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "goal"
      ADD "userId" uuid NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "goal"
      DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "context"
      DROP COLUMN "userId"`);
  }
}
