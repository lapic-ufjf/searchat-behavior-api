/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { Task } from 'src/modules/task/entities/task.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { LlmMessage } from './llm-message.entity';

@Entity('llm_sessions')
export class LlmSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.llmSessions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Task, (task) => task.llmSessions, { onDelete: 'CASCADE' })
  task: Task;

  @Column({ nullable: true, type: 'text' })
  systemInstruction?: string | null;

  @Column({ nullable: true, type: 'text' })
  title?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => LlmMessage, (msg) => msg.session, { cascade: true })
  messages: LlmMessage[];
}
