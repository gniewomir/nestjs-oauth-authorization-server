import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class AuthorizationRequest {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  clientId: string;

  @Column({
    type: "varchar",
    length: 2048,
  })
  redirectUri: string;

  @Column({
    type: "varchar",
    length: 64,
  })
  responseType: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  state: string | null;

  @Column({
    type: "varchar",
    length: 255,
  })
  codeChallenge: string;

  @Column({
    type: "varchar",
    length: 16,
  })
  codeChallengeMethod: string;

  @Column({
    type: "text",
  })
  scope: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  intent: string | null;

  @Index({
    unique: true,
  })
  @Column({
    type: "text",
    nullable: true,
  })
  authCode: string | null;

  @Column({
    type: "int",
    nullable: true,
  })
  authCodeIssued: number | null;

  @Column({
    type: "int",
    nullable: true,
  })
  authCodeExpires: number | null;

  @Column({
    type: "int",
    nullable: true,
  })
  authCodeExchange: number | null;

  @Column({
    type: "uuid",
    nullable: true,
  })
  authCodeSubject: string | null;

  @Column({ type: "varchar", length: 32 })
  resolution: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
