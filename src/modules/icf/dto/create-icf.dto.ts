/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { IcfSectionDto } from './icf-section.dto';

export class CreateIcfDto {
  @ApiProperty({ description: 'ICF title', example: 'Informed Consent' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'ICF description text', example: 'By participating you agree to...' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Structured ICF sections', type: [IcfSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IcfSectionDto)
  sections?: IcfSectionDto[];

  @ApiProperty({ description: 'Experiment ID', example: '64d2f4a8e5f9b20b1c8a9f10' })
  @IsNotEmpty()
  @IsString()
  experimentId: string;
}
