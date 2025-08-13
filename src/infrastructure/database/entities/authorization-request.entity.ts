import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";

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
    length: 255,
  })
  state: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  codeChallenge: string;

  @Column({
    type: "text",
  })
  scope: string;

  @Column({
    type: "jsonb",
    nullable: true,
  })
  authorizationCode: Code | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
