/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExperimentModule } from '../experiment/experiment.module';
import { SurveyModule } from '../survey/survey.module';
import { TaskQuestionMapModule } from '../task-question-map/task-question-map.module';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    forwardRef(() => ExperimentModule),
    forwardRef(() => SurveyModule),
    forwardRef(() => TaskQuestionMapModule),
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule { }
