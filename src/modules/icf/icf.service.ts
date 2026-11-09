/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Experiment } from '../experiment/entity/experiment.entity';
import { ExperimentService } from '../experiment/experiment.service';
import { CreateIcfDto } from './dto/create-icf.dto';
import { UpdateIcfDto } from './dto/update-icf.dto';
import { Icf } from './entity/icf.entity';

@Injectable()
export class IcfService {
  constructor(
    @InjectRepository(Icf)
    private readonly icfRepository: Repository<Icf>,
    @Inject(forwardRef(() => ExperimentService))
    private readonly experimentService: ExperimentService,
  ) { }

  private assertOwner(experiment: Experiment | null, requesterId?: string): void {
    if (requesterId && experiment?.owner_id !== requesterId) {
      throw new ForbiddenException('Você não tem permissão para alterar este termo');
    }
  }

  private async findOwned(id: string, requesterId?: string): Promise<Icf> {
    const icf = await this.find(id);
    if (!icf) {
      throw new NotFoundException('ICF não encontrado');
    }
    if (requesterId) {
      const experiment = await this.experimentService.find(icf.experiment_id);
      this.assertOwner(experiment, requesterId);
    }
    return icf;
  }

  async create(createIcfDto: CreateIcfDto, requesterId?: string): Promise<Icf> {
    const experiment = await this.experimentService.find(
      createIcfDto.experimentId,
    );
    if (!experiment) {
      throw new NotFoundException('Experimento não encontrado');
    }
    this.assertOwner(experiment, requesterId);
    return await this.icfRepository.save({
      title: createIcfDto.title,
      description: createIcfDto.description,
      sections: createIcfDto.sections,
      experiment,
    });
  }

  async findAll(): Promise<Icf[]> {
    return await this.icfRepository.find();
  }

  async find(id: string): Promise<Icf> {
    return await this.icfRepository.findOne({ where: { _id: id } });
  }

  async findOneByExperimentId(experimentId: string): Promise<Icf> {
    return await this.icfRepository.findOne({
      where: { experiment_id: experimentId },
    });
  }

  async update(id: string, updateIcfDto: UpdateIcfDto, requesterId?: string): Promise<Icf> {
    await this.findOwned(id, requesterId);
    await this.icfRepository.update({ _id: id }, updateIcfDto);
    return await this.find(id);
  }

  async remove(id: string, requesterId?: string): Promise<Icf> {
    const icf = await this.findOwned(id, requesterId);
    await this.icfRepository.delete({ _id: id });
    return icf;
  }
}