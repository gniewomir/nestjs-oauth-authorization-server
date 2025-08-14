import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Context } from "@infrastructure/database/entities/context.entity";
import { Goal } from "@infrastructure/database/entities/goal.entity";
import { User } from "@infrastructure/database/entities/user.entity";

@Entity()
export class Task {
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

  @Column()
  goalId: string;

  @ManyToOne(() => Goal, (goal) => goal.tasks, { lazy: true })
  goal: Promise<Goal>;

  @Column()
  contextId: string;

  @ManyToOne(() => Context, (context) => context.tasks, { lazy: true })
  context: Promise<Context>;

  @Column()
  userId: string;

  @ManyToOne(() => User, { lazy: true })
  user: Promise<User>;
}
