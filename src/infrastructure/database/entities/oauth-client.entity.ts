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

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column("text")
  scope: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
