/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IcfSectionDto } from './icf-section.dto';

export class IcfResponseDto {
  @ApiProperty({ description: 'ICF ID', example: '6b1e8c1a-3f7a-4a02-92f9-4b0d7a5d2a11' })
  _id: string;

  @ApiProperty({ description: 'ICF title', example: 'Informed Consent' })
  title: string;

  @ApiProperty({ description: 'ICF description text', example: 'By participating you agree to...' })
  description: string;

  @ApiPropertyOptional({
    description: 'Structured ICF sections',
    type: [IcfSectionDto],
    nullable: true,
  })
  sections?: IcfSectionDto[] | null;

  @ApiProperty({ description: 'Experiment ID associated with this ICF', example: '64d2f4a8e5f9b20b1c8a9f10' })
  experiment_id: string;

  @ApiProperty({ description: 'Whether the record is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-02-24T13:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-02-24T13:30:00.000Z' })
  lastChangeAt: Date;
}
