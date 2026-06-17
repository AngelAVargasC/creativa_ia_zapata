import type { Logger } from '@/core/logging/logger';
import type { UsageInfo, UsageRecorder, GenerationTask } from '@/ai/ports';

/**
 * Recorder por defecto: emite la telemetria como log estructurado.
 * El logger ya viene ligado al tenant, asi que cada registro queda atribuido.
 * Sustituible por una implementacion que persista en `generation_logs`.
 */
export const createLogUsageRecorder = (logger: Logger): UsageRecorder => ({
  record(usage: UsageInfo, meta: { readonly task: GenerationTask }): void {
    logger.info('ai.usage', {
      task: meta.task,
      provider: usage.provider,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      latencyMs: usage.latencyMs,
    });
  },
});
