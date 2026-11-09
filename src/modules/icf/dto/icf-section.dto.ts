/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class IcfSectionDto {
  @ApiProperty({ description: 'Stable section identifier', example: 'risks_benefits' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @MaxLength(64)
  key: string;

  @ApiProperty({ description: 'Section content as HTML', example: '<p>The risks are minimal...</p>' })
  @IsString()
  content: string;
}