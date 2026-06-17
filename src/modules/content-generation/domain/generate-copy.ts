import type { Logger } from '@/core/logging/logger';
import type { TenantContext } from '@/core/tenant';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { LanguageModelPort, UsageInfo } from '@/ai/ports';
import { buildCopyPrompt, findBrandViolations, type BrandProfile, type CopyBrief } from './copy';

export interface GenerateCopyDeps {
  readonly model: LanguageModelPort;
  readonly logger: Logger;
}

export interface GenerateCopyInput {
  readonly tenant: TenantContext;
  readonly brand: BrandProfile;
  readonly brief: CopyBrief;
}

export interface GeneratedCopy {
  readonly text: string;
  readonly usage: UsageInfo;
}

/**
 * Caso de uso: genera un copy y aplica las reglas de marca. Depende solo de
 * puertos (modelo de lenguaje + logger); no conoce proveedor ni framework.
 */
export const generateCopy = async (
  deps: GenerateCopyDeps,
  input: GenerateCopyInput,
): Promise<Result<GeneratedCopy, AppError>> => {
  const { system, prompt } = buildCopyPrompt(input.brand, input.brief);

  const generated = await deps.model.generate({
    task: 'copy',
    system,
    prompt,
    temperature: 0.7,
    maxOutputTokens: 512,
  });

  if (!generated.ok) return generated;

  const text = generated.value.text.trim();

  const violations = findBrandViolations(input.brand, text);
  if (violations.length > 0) {
    deps.logger.warn('copy.brand_violation', { violations });
    return err(new AppError('VALIDATION', `El copy viola lineamientos de marca: ${violations.join(', ')}`));
  }

  if (text.length > input.brief.maxChars) {
    return err(
      new AppError('VALIDATION', `El copy excede el limite de ${input.brief.maxChars} caracteres (${text.length})`),
    );
  }

  deps.logger.info('copy.generated', { chars: text.length, platform: input.brief.platform });
  return ok({ text, usage: generated.value.usage });
};
