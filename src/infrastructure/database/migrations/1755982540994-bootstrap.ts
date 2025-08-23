import { MigrationInterface, QueryRunner } from "typeorm";

export class Bootstrap1755982540994 implements MigrationInterface {
  name = "Bootstrap1755982540994";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user"
       (
         "id"            uuid                   NOT NULL,
         "email"         character varying(254) NOT NULL,
         "emailVerified" boolean                NOT NULL DEFAULT false,
         "password"      character varying(60)  NOT NULL,
         "refreshTokens" jsonb                  NOT NULL DEFAULT '[]',
         "createdAt"     TIMESTAMP              NOT NULL DEFAULT now(),
         "updatedAt"     TIMESTAMP              NOT NULL DEFAULT now(),
         CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
         CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE TABLE "context"
       (
         "id"          uuid      NOT NULL,
         "orderKey"    text      NOT NULL,
         "description" text      NOT NULL,
         "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "userId"      uuid      NOT NULL,
         CONSTRAINT "PK_d1ff50573dd9c6c1d0896805701" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE TABLE "goal"
       (
         "id"          uuid      NOT NULL,
         "orderKey"    text      NOT NULL,
         "description" text      NOT NULL,
         "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "userId"      uuid      NOT NULL,
         CONSTRAINT "PK_88c8e2b461b711336c836b1e130" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE TABLE "task"
       (
         "id"          uuid      NOT NULL,
         "orderKey"    text      NOT NULL,
         "description" text      NOT NULL,
         "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
         "goalId"      uuid      NOT NULL,
         "contextId"   uuid      NOT NULL,
         "userId"      uuid      NOT NULL,
         CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_clients"
       (
         "id"           uuid                   NOT NULL,
         "name"         character varying(128) NOT NULL,
         "scope"        text                   NOT NULL,
         "redirectUri"  text                   NOT NULL,
         "registration" boolean                NOT NULL,
         "createdAt"    TIMESTAMP              NOT NULL DEFAULT now(),
         "updatedAt"    TIMESTAMP              NOT NULL DEFAULT now(),
         CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE TABLE "authorization_request"
       (
         "id"                  uuid                    NOT NULL,
         "clientId"            uuid                    NOT NULL,
         "redirectUri"         character varying(2048) NOT NULL,
         "responseType"        character varying(64)   NOT NULL,
         "state"               character varying(255)  NOT NULL,
         "codeChallenge"       character varying(255)  NOT NULL,
         "codeChallengeMethod" character varying(16)   NOT NULL,
         "scope"               text                    NOT NULL,
         "intent"              character varying(32),
         "authCode"            character varying(64),
         "authCodeIssued"      integer,
         "authCodeExpires"     integer,
         "authCodeExchange"    integer,
         "authCodeSubject"     uuid,
         "resolution"          character varying(32)   NOT NULL,
         "createdAt"           TIMESTAMP               NOT NULL DEFAULT now(),
         "updatedAt"           TIMESTAMP               NOT NULL DEFAULT now(),
         CONSTRAINT "PK_a5f71bde33c44d6d8c40aca488b" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9d1e673b6d1ef4c1f6d4c3c9c" ON "authorization_request" ("authCode") `,
    );
    await queryRunner.query(
      `ALTER TABLE "context"
        ADD CONSTRAINT "FK_0322101a7b8da74eec6ed00cfe4" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal"
        ADD CONSTRAINT "FK_40bd308ea814964cec7146c6dce" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task"
        ADD CONSTRAINT "FK_266bc4eb256aee41118272eccf3" FOREIGN KEY ("goalId") REFERENCES "goal" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task"
        ADD CONSTRAINT "FK_3cfe74a87c3c74b320ca95574e4" FOREIGN KEY ("contextId") REFERENCES "context" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task"
        ADD CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task"
        DROP CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task"
        DROP CONSTRAINT "FK_3cfe74a87c3c74b320ca95574e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task"
        DROP CONSTRAINT "FK_266bc4eb256aee41118272eccf3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal"
        DROP CONSTRAINT "FK_40bd308ea814964cec7146c6dce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "context"
        DROP CONSTRAINT "FK_0322101a7b8da74eec6ed00cfe4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9d1e673b6d1ef4c1f6d4c3c9c"`,
    );
    await queryRunner.query(`DROP TABLE "authorization_request"`);
    await queryRunner.query(`DROP TABLE "oauth_clients"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TABLE "goal"`);
    await queryRunner.query(`DROP TABLE "context"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
