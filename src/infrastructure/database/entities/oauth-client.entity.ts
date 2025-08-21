import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("oauth_clients")
export class OauthClient {
  @PrimaryColumn("uuid")
  id: string;

  @Column("varchar", { length: 128, nullable: false })
  name: string;

  @Column("text")
  scope: string;

  @Column("text")
  redirectUri: string;

  @Column("boolean")
  registration: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
