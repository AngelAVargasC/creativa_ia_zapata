import { generateText, streamText, type LanguageModelV1 } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import type { ServerEnv } from '@/config/env';
import type { Logger } from '@/core/logging/logger';
import { AppError, toAppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import {
  type GenerationRequest,
  type GenerationResult,
  type LanguageModelPort,
  type UsageInfo,
  type UsageRecorder,
} from '@/ai/ports';
import { routeModel, type ModelChoice } from '@/ai/models';

interface AdapterDeps {
  readonly env: ServerEnv;
  readonly usage: UsageRecorder;
  readonly logger: Logger;
}

/** Lee tokens de forma defensiva (v4 expone promptTokens/completionTokens). */
const readTokens = (
  u: { promptTokens?: number; completionTokens?: number; inputTokens?: number; outputTokens?: number } | undefined,
): { input: number; output: number } => ({
  input: u?.inputTokens ?? u?.promptTokens ?? 0,
  output: u?.outputTokens ?? u?.completionTokens ?? 0,
});

/**
 * Adapter unico sobre Vercel AI SDK. Resuelve el modelo por tarea (provider
 * router) y traduce el SDK a nuestro puerto. Si falta la clave del proveedor
 * elegido, falla rapido con PROVIDER_UNAVAILABLE.
 */
export const createVercelAiModel = (deps: AdapterDeps): LanguageModelPort => {
  const { env, usage, logger } = deps;

  const resolve = (choice: ModelChoice): LanguageModelV1 => {
    switch (choice.provider) {
      case 'anthropic': {
        if (!env.ANTHROPIC_API_KEY) {
          throw new AppError('PROVIDER_UNAVAILABLE', 'ANTHROPIC_API_KEY no configurada');
        }
        return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(choice.model);
      }
      case 'openai': {
        if (!env.OPENAI_API_KEY) {
          throw new AppError('PROVIDER_UNAVAILABLE', 'OPENAI_API_KEY no configurada');
        }
        return createOpenAI({ apiKey: env.OPENAI_API_KEY })(choice.model);
      }
      case 'google': {
        if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
          throw new AppError('PROVIDER_UNAVAILABLE', 'GOOGLE_GENERATIVE_AI_API_KEY no configurada');
        }
        return createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })(choice.model);
      }
    }
  };

  return {
    async generate(req: GenerationRequest): Promise<Result<GenerationResult, AppError>> {
      const choice = routeModel(req.task, env);
      try {
        const model = resolve(choice);
        const start = Date.now();
        const result = await generateText({
          model,
          system: req.system,
          prompt: req.prompt,
          temperature: req.temperature,
          maxTokens: req.maxOutputTokens,
        });
        const tokens = readTokens(result.usage);
        const usageInfo: UsageInfo = {
          provider: choice.provider,
          model: choice.model,
          inputTokens: tokens.input,
          outputTokens: tokens.output,
          latencyMs: Date.now() - start,
        };
        usage.record(usageInfo, { task: req.task });
        return ok({ text: result.text, usage: usageInfo });
      } catch (e) {
        const error = toAppError(e, 'PROVIDER_ERROR');
        logger.error('ai.generate.failed', { task: req.task, provider: choice.provider, code: error.code });
        return err(error);
      }
    },

    async stream(req: GenerationRequest): Promise<Result<ReadableStream<Uint8Array>, AppError>> {
      const choice = routeModel(req.task, env);
      try {
        const model = resolve(choice);
        const start = Date.now();
        const result = streamText({
          model,
          system: req.system,
          prompt: req.prompt,
          temperature: req.temperature,
          maxTokens: req.maxOutputTokens,
          onFinish: (event) => {
            const tokens = readTokens(event.usage);
            usage.record(
              {
                provider: choice.provider,
                model: choice.model,
                inputTokens: tokens.input,
                outputTokens: tokens.output,
                latencyMs: Date.now() - start,
              },
              { task: req.task },
            );
          },
        });
        const body = result.toTextStreamResponse().body;
        if (!body) return err(new AppError('PROVIDER_ERROR', 'El proveedor no devolvio stream'));
        return ok(body);
      } catch (e) {
        const error = toAppError(e, 'PROVIDER_ERROR');
        logger.error('ai.stream.failed', { task: req.task, provider: choice.provider, code: error.code });
        return err(error);
      }
    },
  };
};
