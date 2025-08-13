import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("oauth_clients")
export class OauthClient {
  @PrimaryColumn("uuid")
  id: string;

  @Column("varchar", { length: 255, nullable: false })
  name: string;
}
