import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthorizationRequest1755108447315 implements MigrationInterface {
  name = "AuthorizationRequest1755108447315";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "authorization_request"
                             (
                               "id"                uuid                    NOT NULL,
                               "clientId"          uuid                    NOT NULL,
                               "redirectUri"       character varying(2048) NOT NULL,
                               "state"             character varying(255)  NOT NULL,
                               "codeChallenge"     character varying(255)  NOT NULL,
                               "scope"             jsonb                   NOT NULL,
                               "authorizationCode" jsonb,
                               "createdAt"         TIMESTAMP               NOT NULL DEFAULT now(),
                               "updatedAt"         TIMESTAMP               NOT NULL DEFAULT now(),
                               CONSTRAINT "PK_a5f71bde33c44d6d8c40aca488b" PRIMARY KEY ("id")
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "authorization_request"`);
  }
}
