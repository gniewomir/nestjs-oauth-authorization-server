import { MigrationInterface, QueryRunner } from "typeorm";

export class OauthClient1755123642193 implements MigrationInterface {
  name = "OauthClient1755123642193";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "oauth_clients"
                             (
                               "id"   uuid                   NOT NULL,
                               "name" character varying(255) NOT NULL,
                               CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id")
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "oauth_clients"`);
  }
}
