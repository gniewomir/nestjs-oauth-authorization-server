import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScopesToOauthClient1755296579576 implements MigrationInterface {
  name = "AddScopesToOauthClient1755296579576";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      ADD "scope" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "oauth_clients"
      DROP COLUMN "scope"`);
  }
}
