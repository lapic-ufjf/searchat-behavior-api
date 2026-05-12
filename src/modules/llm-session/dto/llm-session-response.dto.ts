/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { ApiProperty } from '@nestjs/swagger';

export class LlmMessageResponseDto {
  @ApiProperty({ description: 'Message ID', example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef' })
  id: string;

  @ApiProperty({ description: 'Message content', example: 'You can start by comparing multiple sources.' })
  content: string;

  @ApiProperty({ description: 'Message sender role', example: 'model', enum: ['user', 'model'] })
  role: 'user' | 'model';

  @ApiProperty({ description: 'Message timestamp', example: '2026-02-24T13:35:00.000Z' })
  createdAt: Date;
}

export class LlmSessionSummaryDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Session title', nullable: true })
  title: string | null;

  @ApiProperty({ description: 'Session creation date' })
  createdAt: Date;
}

export class LlmSessionResponseDto {
  @ApiProperty({ description: 'Session ID', example: '8e2c1a3f-7a4a-4029-92f9-4b0d7a5d2a88' })
  id: string;

  @ApiProperty({ description: 'Session title', nullable: true })
  title?: string | null;

  @ApiProperty({ description: 'Session creation date' })
  createdAt?: Date;

  @ApiProperty({ description: 'Session messages', type: [LlmMessageResponseDto], required: false })
  messages?: LlmMessageResponseDto[];
}
