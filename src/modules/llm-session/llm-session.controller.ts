/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {Response} from 'express';

import {LlmProviderModelsResponseDto} from './dto/llm-provider-models-response.dto';
import {LlmProviderResponseDto} from './dto/llm-provider-response.dto';
import {LlmSessionResponseDto, LlmSessionSummaryDto} from './dto/llm-session-response.dto';
import {LlmSessionService} from './llm-session.service';

@ApiTags('LLM Session')
@ApiBearerAuth('jwt')
@UseGuards(AuthGuard('jwt'))
@Controller('llm-session')
export class LlmSessionController {
  constructor(private readonly llmSessionService: LlmSessionService) {}

  @Get('providers')
  @ApiOperation({summary: 'List supported LLM providers'})
  @ApiResponse({
    status: 200,
    description: 'Supported providers.',
    type: LlmProviderResponseDto,
    isArray: true,
  })
  getProviders(): LlmProviderResponseDto[] {
    return this.llmSessionService.getProviders();
  }

  @Get('providers/:provider/models')
  @ApiOperation({summary: 'List suggested models for an LLM provider'})
  @ApiParam({
    name: 'provider',
    type: String,
    description: 'Provider identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggested provider models.',
    type: LlmProviderModelsResponseDto,
  })
  getProviderModels(
    @Param('provider') provider: string,
  ): LlmProviderModelsResponseDto {
    return this.llmSessionService.getProviderModels(provider);
  }

  @Get()
  @ApiOperation({summary: 'List LLM sessions for a user and task'})
  @ApiResponse({
    status: 200,
    description: 'Sessions list.',
    type: LlmSessionSummaryDto,
    isArray: true,
  })
  async listSessions(
    @Query('userId') userId: string,
    @Query('taskId') taskId: string,
  ): Promise<LlmSessionSummaryDto[]> {
    return this.llmSessionService.listSessions(userId, taskId);
  }

  @Post('start')
  @ApiOperation({summary: 'Start or resume an LLM session'})
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskId: {type: 'string', description: 'Task ID'},
        userId: {type: 'string', description: 'User ID'},
        sessionId: {type: 'string', description: 'Load a specific session by ID'},
        forceNew: {type: 'boolean', description: 'Force creation of a new session'},
      },
      required: ['taskId', 'userId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Session started.',
    type: LlmSessionResponseDto,
  })
  async startSession(
    @Body() body: {taskId: string; userId: string; sessionId?: string; forceNew?: boolean},
  ) {
    return this.llmSessionService.startSession(body.userId, body.taskId, {
      sessionId: body.sessionId,
      forceNew: body.forceNew,
    });
  }

  @Post(':id/message')
  @ApiOperation({summary: 'Send a message to an LLM session'})
  @ApiParam({name: 'id', type: String, description: 'LLM session ID'})
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {type: 'string', description: 'User ID'},
        content: {type: 'string', description: 'Message content'},
      },
      required: ['userId', 'content'],
    },
  })
  @ApiProduces('text/plain')
  @ApiResponse({
    status: 200,
    description: 'Streaming response from the model.',
    schema: {
      type: 'string',
      example:
        'This topic can be explored by comparing multiple independent sources...',
    },
  })
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() body: {userId: string; content: string},
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      const {stream, saveBotResponse} =
        await this.llmSessionService.processChatMessage(
          sessionId,
          body.userId,
          body.content,
        );

      let fullBotResponse = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text();
        fullBotResponse += chunkText;
        res.write(chunkText);
      }

      await saveBotResponse(fullBotResponse);
    } catch (error) {
      console.error('Error processing chat message:', error.message);
      res.write('\n[ERROR: Error to generate  response]');
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}
