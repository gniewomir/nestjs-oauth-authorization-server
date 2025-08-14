import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderingAddOrderKey1755186282535 implements MigrationInterface {
  name = "OrderingAddOrderKey1755186282535";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "context" RENAME COLUMN "ordinalNumber" TO "orderKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "context" RENAME CONSTRAINT "UQ_fe281d24b737e6c74e10538a992" TO "UQ_ec90e1554426860b823aa2dc167"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" RENAME COLUMN "ordinalNumber" TO "orderKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" RENAME CONSTRAINT "UQ_fea8eabb844124b981085876881" TO "UQ_78e8c4b02adb15fa1863fce47c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" RENAME COLUMN "ordinalNumber" TO "orderKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" RENAME CONSTRAINT "UQ_ee31038ea78470491f3b3f8382b" TO "UQ_865a9f05c7fdcc87862d772c635"`,
    );
    await queryRunner.query(
      `ALTER TABLE "context" DROP CONSTRAINT "UQ_ec90e1554426860b823aa2dc167"`,
    );
    await queryRunner.query(`ALTER TABLE "context" DROP COLUMN "orderKey"`);
    await queryRunner.query(
      `ALTER TABLE "context" ADD "orderKey" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" DROP CONSTRAINT "UQ_78e8c4b02adb15fa1863fce47c1"`,
    );
    await queryRunner.query(`ALTER TABLE "goal" DROP COLUMN "orderKey"`);
    await queryRunner.query(`ALTER TABLE "goal" ADD "orderKey" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "UQ_865a9f05c7fdcc87862d772c635"`,
    );
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "orderKey"`);
    await queryRunner.query(`ALTER TABLE "task" ADD "orderKey" text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "orderKey"`);
    await queryRunner.query(
      `ALTER TABLE "task" ADD "orderKey" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "UQ_865a9f05c7fdcc87862d772c635" UNIQUE ("orderKey")`,
    );
    await queryRunner.query(`ALTER TABLE "goal" DROP COLUMN "orderKey"`);
    await queryRunner.query(
      `ALTER TABLE "goal" ADD "orderKey" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" ADD CONSTRAINT "UQ_78e8c4b02adb15fa1863fce47c1" UNIQUE ("orderKey")`,
    );
    await queryRunner.query(`ALTER TABLE "context" DROP COLUMN "orderKey"`);
    await queryRunner.query(
      `ALTER TABLE "context" ADD "orderKey" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "context" ADD CONSTRAINT "UQ_ec90e1554426860b823aa2dc167" UNIQUE ("orderKey")`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" RENAME CONSTRAINT "UQ_865a9f05c7fdcc87862d772c635" TO "UQ_ee31038ea78470491f3b3f8382b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" RENAME COLUMN "orderKey" TO "ordinalNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" RENAME CONSTRAINT "UQ_78e8c4b02adb15fa1863fce47c1" TO "UQ_fea8eabb844124b981085876881"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goal" RENAME COLUMN "orderKey" TO "ordinalNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "context" RENAME CONSTRAINT "UQ_ec90e1554426860b823aa2dc167" TO "UQ_fe281d24b737e6c74e10538a992"`,
    );
    await queryRunner.query(
      `ALTER TABLE "context" RENAME COLUMN "orderKey" TO "ordinalNumber"`,
    );
  }
}
