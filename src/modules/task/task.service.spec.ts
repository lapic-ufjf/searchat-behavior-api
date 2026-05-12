/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ExperimentService } from '../experiment/experiment.service';
import { SurveyService } from '../survey/survey.service';
import { TaskQuestionMapService } from '../task-question-map/task-question-map.service';
import { TaskSurveyService } from '../task-survey/task-survey.service';
import { Task } from './entities/task.entity';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    taskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepository,
        },
        {
          provide: ExperimentService,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: SurveyService,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: TaskQuestionMapService,
          useValue: {
            findQuestionsByTask: jest.fn(),
          },
        },
        {
          provide: TaskSurveyService,
          useValue: {
            link: jest.fn(),
            unlink: jest.fn(),
            findSurveysByTask: jest.fn(),
            findTasksBySurvey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose provider alias instead of openrouter in task output', () => {
    const result = (service as unknown as {
      applyProviderConfigMask: (task: Task) => unknown;
    }).applyProviderConfigMask({
      provider_config: {
        modelProvider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        apiKey: 'secret-key',
      },
    } as Task);

    expect(result).toEqual(
      expect.objectContaining({
        provider_config: expect.objectContaining({
          modelProvider: 'openai',
          model: 'openai/gpt-4o-mini',
        }),
      }),
    );
  });
});
