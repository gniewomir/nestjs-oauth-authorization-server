import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { RefreshTokenValue } from "@domain/authentication/OAuth/User/RefreshTokenValue";

@Entity()
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 254, // per: https://www.directedignorance.com/blog/maximum-length-of-email-address#the-answer
    unique: true,
  })
  email: string;

  @Column({
    type: "boolean",
    default: false,
  })
  emailVerified: boolean;

  @Column({
    type: "varchar",
    length: 60, // per https://www.npmjs.com/package/bcrypt#user-content-hash-info
  })
  password: string;

  @Column({
    type: "jsonb",
    default: [],
  })
  refreshTokens: RefreshTokenValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
