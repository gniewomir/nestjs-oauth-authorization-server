import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Task } from "@infrastructure/database/entities/task.entity";
import { User } from "@infrastructure/database/entities/user.entity";

@Entity()
export class Context {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    nullable: false,
    unique: false,
    type: "text",
  })
  orderKey: string;

  @Column({
    nullable: false,
    unique: false,
    type: "text",
  })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.goal, { lazy: true })
  tasks: Promise<Task[]>;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => User, { lazy: true })
  user: Promise<User>;
}
