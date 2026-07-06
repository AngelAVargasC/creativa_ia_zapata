import 'server-only';
import { loadServerEnv } from '@/config/env';
import { createLogger } from '@/core/logging/logger';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { TenantContext } from '@/core/tenant';
import { createVercelAiModel } from '@/ai/adapters/vercel-ai-sdk';
import { createLogUsageRecorder } from '@/ai/usage';
import { buildCopyPrompt, tokenBudgetFor, type BrandProfile, type CopyBrief } from '../domain/copy';
import { generateCopy, type GeneratedCopy } from '../domain/generate-copy';

export interface CopyServiceInput {
  readonly tenant: TenantContext;
  readonly brand: BrandProfile;
  readonly brief: CopyBrief;
}

/** Construye el modelo con el logger ya ligado al tenant (telemetria atribuida). */
const buildModel = (tenant: TenantContext) => {
  const logger = createLogger({ module: 'content-generation', tenantId: tenant.tenantId, userId: tenant.userId });
  const env = loadServerEnv();
  const usage = createLogUsageRecorder(logger);
  return { logger, model: createVercelAiModel({ env, usage, logger }) };
};

/** Composicion: env + adapter + logger -> caso de uso. Punto de entrada del API. */
export const runGenerateCopy = async (input: CopyServiceInput): Promise<Result<GeneratedCopy, AppError>> => {
  const { logger, model } = buildModel(input.tenant);
  return generateCopy({ model, logger }, input);
};

/** Variante en streaming para respuesta en vivo (texto plano UTF-8). */
export const streamGenerateCopy = async (
  input: CopyServiceInput,
): Promise<Result<ReadableStream<Uint8Array>, AppError>> => {
  const { model } = buildModel(input.tenant);
  const { system, prompt } = buildCopyPrompt(input.brand, input.brief);
  const res = await model.stream({
    task: 'copy',
    system,
    prompt,
    temperature: 0.85,
    maxOutputTokens: tokenBudgetFor(input.brief.maxChars),
  });
  if (!res.ok) return err(res.error);
  return ok(res.value);
};
