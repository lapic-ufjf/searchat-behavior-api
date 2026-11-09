/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { BaseEntity } from 'src/model/base-entity';
import { Experiment } from 'src/modules/experiment/entity/experiment.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export class IcfSection {
  key: string;
  content: string;
}

@Entity()
export class Icf extends BaseEntity {
  @Column()
  title: string;
  @Column({ type: 'text' })
  description: string;
  @Column({ type: 'simple-json', nullable: true })
  sections: IcfSection[] | null;
  @ManyToOne(() => Experiment, (experiment) => experiment.icfs, {
    onDelete: 'CASCADE',
  })
  experiment: Experiment;
  @Column()
  experiment_id: string;
}