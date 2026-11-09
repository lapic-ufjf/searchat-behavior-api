/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from 'src/common/dto/api-responses.dto';

import { CreateIcfDto } from './dto/create-icf.dto';
import { IcfResponseDto } from './dto/icf-response.dto';
import { UpdateIcfDto } from './dto/update-icf.dto';
import { Icf } from './entity/icf.entity';
import { IcfService } from './icf.service';

interface AuthenticatedRequest {
  user: { id: string };
}

@ApiTags('ICF')
@ApiBearerAuth('jwt')
@UseGuards(AuthGuard('jwt'))
@Controller('icf')
export class IcfController {
  constructor(private readonly icfService: IcfService) { }

  @Post()
  @ApiOperation({ summary: 'Create a icf' })
  @ApiBody({ type: CreateIcfDto })
  @ApiResponse({ status: 201, description: 'ICF created successfully.', type: IcfResponseDto })
  @ApiResponse({ status: 403, description: 'Only the experiment owner can create its ICF.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Experiment not found.', type: ErrorResponseDto })
  async create(
    @Body() createIcfDto: CreateIcfDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Icf> {
    return await this.icfService.create(createIcfDto, req.user.id);
  }

  @ApiOperation({ summary: 'Get all icfs' })
  @Get()
  @ApiResponse({ status: 200, description: 'List of ICFs.', type: IcfResponseDto, isArray: true })
  async findAll(): Promise<Icf[]> {
    return await this.icfService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a icf by id' })
  @ApiParam({ name: 'id', type: String, description: 'ICF ID' })
  @ApiResponse({ status: 200, description: 'ICF details.', type: IcfResponseDto })
  @ApiResponse({ status: 404, description: 'ICF not found.', type: ErrorResponseDto })
  async findOne(@Param('id') id: string): Promise<Icf> {
    const icf = await this.icfService.find(id);
    if (!icf) {
      throw new NotFoundException('ICF não encontrado');
    }
    return icf;
  }

  @Get('experiment/:experimentId')
  @ApiOperation({ summary: 'Get a icf by experimentId' })
  @ApiParam({ name: 'experimentId', type: String, description: 'Experiment ID' })
  @ApiResponse({ status: 200, description: 'ICF linked to the experiment.', type: IcfResponseDto })
  @ApiResponse({ status: 404, description: 'ICF not found for this experiment.', type: ErrorResponseDto })
  async findOneByExperimentId(
    @Param('experimentId') experimentId: string,
  ): Promise<Icf> {
    const icf = await this.icfService.findOneByExperimentId(experimentId);
    if (!icf) {
      throw new NotFoundException('ICF não encontrado para este experimento');
    }
    return icf;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a icf by id' })
  @ApiParam({ name: 'id', type: String, description: 'ICF ID' })
  @ApiBody({ type: UpdateIcfDto })
  @ApiResponse({ status: 200, description: 'ICF updated successfully.', type: IcfResponseDto })
  @ApiResponse({ status: 403, description: 'Only the experiment owner can update its ICF.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'ICF not found.', type: ErrorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateIcfDto: UpdateIcfDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Icf> {
    return await this.icfService.update(id, updateIcfDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a icf by id' })
  @ApiParam({ name: 'id', type: String, description: 'ICF ID' })
  @ApiResponse({ status: 200, description: 'ICF deleted successfully.', type: IcfResponseDto })
  @ApiResponse({ status: 403, description: 'Only the experiment owner can delete its ICF.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'ICF not found.', type: ErrorResponseDto })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.icfService.remove(id, req.user.id);
  }
}