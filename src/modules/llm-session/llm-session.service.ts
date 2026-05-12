/*
 * Copyright (c) 2026, lapic-ufjf
 * Licensed under The MIT License [see LICENSE for details]
 */

import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {ChatOpenAI} from '@langchain/openai';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Task} from 'src/modules/task/entities/task.entity';
import {User} from 'src/modules/user/entity/user.entity';
import {Repository} from 'typeorm';

import {
  getDisplayProviderValue,
  getPublicLlmProviderEntries,
  resolveLlmProvider,
} from './constants/llm-provider-registry.constants';
import {LlmMessage} from './entity/llm-message.entity';
import {LlmSession} from './entity/llm-session.entity';

@Injectable()
export class LlmSessionService {
  constructor(
    @InjectRepository(LlmSession)
    private readonly llmSessionRepository: Repository<LlmSession>,
    @InjectRepository(LlmMessage)
    private readonly llmMessageRepository: Repository<LlmMessage>,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
  ) {}

  getProviders() {
    return getPublicLlmProviderEntries().map(
      ({value, label, defaultModel, suggestedModels}) => ({
        value,
        label,
        defaultModel,
        suggestedModels,
      }),
    );
  }

  getProviderModels(provider: string) {
    const providerConfig = resolveLlmProvider(provider);
    if (!providerConfig || !providerConfig.public) {
      throw new NotFoundException('LLM provider not found');
    }
    return {
      provider:
        getDisplayProviderValue(
          providerConfig.value,
          providerConfig.defaultModel,
        ) ?? providerConfig.value,
      defaultModel: providerConfig.defaultModel,
      suggestedModels: providerConfig.suggestedModels,
    };
  }

  async startSession(
    userId: string,
    taskId: string,
    options?: {sessionId?: string; forceNew?: boolean},
  ): Promise<LlmSession> {
    if (options?.sessionId) {
      const session = await this.llmSessionRepository.findOne({
        where: {id: options.sessionId, user: {_id: userId}, task: {_id: taskId}},
        relations: ['messages'],
        order: {messages: {createdAt: 'ASC'}},
      });
      if (!session) throw new NotFoundException('Session not found');
      return session;
    }

    if (!options?.forceNew) {
      const existingSession = await this.llmSessionRepository.findOne({
        where: {user: {_id: userId}, task: {_id: taskId}},
        relations: ['messages'],
        order: {createdAt: 'DESC', messages: {createdAt: 'ASC'}},
      });
      if (existingSession) return existingSession;
    }

    const task = await this.taskRepository
      .createQueryBuilder('task')
      .addSelect('task.provider_config')
      .where('task._id = :taskId', {taskId})
      .getOne();
    if (!task) throw new NotFoundException('Task not found');

    const count = await this.llmSessionRepository.count({
      where: {user: {_id: userId}, task: {_id: taskId}},
    });

    const newSession = this.llmSessionRepository.create({
      user: {_id: userId} as User,
      task: task,
      systemInstruction: task.provider_config?.systemInstruction ?? null,
      title: `Conversa ${count + 1}`,
    });

    return await this.llmSessionRepository.save(newSession);
  }

  async listSessions(
    userId: string,
    taskId: string,
  ): Promise<{id: string; title: string | null; createdAt: Date}[]> {
    if (!userId || !taskId) throw new BadRequestException('userId and taskId are required');
    const sessions = await this.llmSessionRepository.find({
      where: {user: {_id: userId}, task: {_id: taskId}},
      select: ['id', 'title', 'createdAt'],
      order: {createdAt: 'ASC'},
    });
    return sessions.map((s) => ({id: s.id, title: s.title ?? null, createdAt: s.createdAt}));
  }

  async processChatMessage(sessionId: string, userId: string, content: string) {
    const session = await this.llmSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.task', 'task')
      .leftJoinAndSelect('session.user', 'user')
      .addSelect('task.provider_config')
      .where('session.id = :sessionId', {sessionId})
      .getOne();
    if (!session) throw new NotFoundException('Session not found');
    if (session.user._id !== userId)
      throw new ForbiddenException('Session does not belong to user');
    const providerConfig = session.task.provider_config || {};
    if (!providerConfig.apiKey || !providerConfig.modelProvider) {
      throw new ForbiddenException('Task without AI configuration');
    }

    await this.llmMessageRepository.save({
      content: content,
      role: 'user',
      session: session,
    });

    const history = await this.llmMessageRepository.find({
      where: {session: {id: sessionId}},
      order: {createdAt: 'DESC'},
      take: 20,
    });
    history.reverse();

    const providerName = String(providerConfig.modelProvider);
    const provider = resolveLlmProvider(providerName, String(providerConfig.model || ''));
    if (!provider) {
      throw new ForbiddenException('LLM provider not supported');
    }

    const messages: BaseMessage[] = [];
    if (providerConfig.systemInstruction) {
      messages.push(
        new SystemMessage(String(providerConfig.systemInstruction)),
      );
    }
    messages.push(
      ...history.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
    );

    const baseURL = providerConfig.baseURL || provider.baseURL;
    const model = new ChatOpenAI({
      apiKey: String(providerConfig.apiKey),
      model: String(providerConfig.model || provider.defaultModel),
      temperature: Number(providerConfig.temperature ?? 0.5),
      streaming: true,
      configuration: baseURL
        ? {
            baseURL: String(baseURL),
            defaultHeaders: provider.defaultHeaders,
          }
        : undefined,
    });

    try {
      const stream = await model.stream(messages);

      return {
        stream: this.toTextChunkStream(stream),
        saveBotResponse: async (fulltext: string) => {
          await this.llmMessageRepository.save({
            content: fulltext,
            role: 'model',
            session: session,
          });
        },
      };
    } catch (error) {
      console.error('Error LangChain:', error);
      throw new Error('Error processing LLM response', {cause: error});
    }
  }

  private async *toTextChunkStream(stream: AsyncIterable<unknown>) {
    for await (const chunk of stream) {
      yield {
        text: () => this.extractTextFromChunk(chunk),
      };
    }
  }

  private extractTextFromChunk(chunk: unknown): string {
    const content = (chunk as {content?: unknown}).content;
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as {text: unknown}).text);
          }
          return '';
        })
        .join('');
    }
    return '';
  }

  async findByUserIdAndTaskId(
    userId: string,
    taskId: string,
  ): Promise<LlmSession> {
    return await this.llmSessionRepository.findOne({
      where: {
        user: {_id: userId},
        task: {_id: taskId},
      },
      relations: ['messages'],
    });
  }
}
