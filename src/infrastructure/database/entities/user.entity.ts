import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 254, // per: https://www.directedignorance.com/blog/maximum-length-of-email-address#the-answer
  })
  email: string;

  @Column({
    type: "varchar",
    length: 60, // per https://www.npmjs.com/package/bcrypt#user-content-hash-info
  })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
