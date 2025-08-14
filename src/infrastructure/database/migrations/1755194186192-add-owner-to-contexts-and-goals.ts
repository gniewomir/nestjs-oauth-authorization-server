import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerToContextsAndGoals1755194186192
  implements MigrationInterface
{
  name = "AddOwnerToContextsAndGoals1755194186192";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "context"
      ADD "assignedId" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "goal"
      ADD "assignedId" uuid NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "goal"
      DROP COLUMN "assignedId"`);
    await queryRunner.query(`ALTER TABLE "context"
      DROP COLUMN "assignedId"`);
  }
}
