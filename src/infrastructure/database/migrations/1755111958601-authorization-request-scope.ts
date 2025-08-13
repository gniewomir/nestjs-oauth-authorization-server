import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthorizationRequestScope1755111958601
  implements MigrationInterface
{
  name = "AuthorizationRequestScope1755111958601";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "authorization_request"
      DROP COLUMN "scope"`);
    await queryRunner.query(`ALTER TABLE "authorization_request"
      ADD "scope" text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "authorization_request"
      DROP COLUMN "scope"`);
    await queryRunner.query(`ALTER TABLE "authorization_request"
      ADD "scope" jsonb NOT NULL`);
  }
}
