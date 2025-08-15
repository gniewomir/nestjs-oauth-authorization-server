import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthRequest1755265025606 implements MigrationInterface {
  name = "UpdateAuthRequest1755265025606";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "authorization_request"
      ADD "responseType" character varying(64) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "authorization_request"
      ADD "codeChallengeMethod" character varying(16) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "authorization_request"
      DROP COLUMN "codeChallengeMethod"`);
    await queryRunner.query(`ALTER TABLE "authorization_request"
      DROP COLUMN "responseType"`);
  }
}
