import 'server-only';
import { loadServerEnv } from '@/config/env';
import { createLogger } from '@/core/logging/logger';
import { AppError } from '@/core/errors';
import { type Result } from '@/core/result';
import { createVercelAiModel } from '@/ai/adapters/vercel-ai-sdk';
import { createLogUsageRecorder } from '@/ai/usage';
import type { CaptionRequest } from './schema';

/**
 * Redactor de captions para posts de autos seminuevos (voz Go On / Grupo Zapata).
 * Genera texto listo para Instagram/Facebook a partir de los datos del auto.
 */
const buildCaptionPrompt = (input: CaptionRequest): { system: string; prompt: string } => {
  const system = [
    'Eres el redactor de redes sociales de Go On Seminuevos (Grupo Zapata), en México.',
    'Escribes captions para Instagram/Facebook de autos seminuevos, en español de México.',
    'Tono cercano, aspiracional y claro; profesional sin sonar corporativo.',
    'Estructura del caption:',
    '1) Gancho con el modelo y el precio actual.',
    '2) Una o dos líneas con specs o beneficios clave.',
    '3) El precio anterior tachado mentalmente y el precio de oferta (de X a Y MXN).',
    '4) CTA para agendar prueba de manejo en la agencia Zapata más cercana.',
    '5) 4 a 6 hashtags relevantes al final.',
    'Usa emojis con moderación (por ejemplo 🖤 ⚡ 👇). NO inventes datos que no te den.',
    'Devuelve SOLO el caption, sin comillas ni encabezados.',
  ].join('\n');

  const datos = [
    `Modelo: ${input.modelo}${input.tagline ? ` (${input.tagline})` : ''}`,
    input.precioAhora ? `Precio de oferta: ${input.precioAhora} MXN` : '',
    input.precioAntes ? `Precio anterior: ${input.precioAntes} MXN` : '',
    input.spec ? `Specs destacadas: ${input.spec}` : '',
    input.extra ? `Detalles extra: ${input.extra}` : '',
    input.info ? `Información adicional de la solicitud: ${input.info}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, prompt: `Redacta el caption con estos datos:\n${datos}` };
};

export interface CaptionContext {
  readonly tenantId: string;
  readonly userId: string;
}

/** Genera el caption completo (texto). Atribuye la telemetria al tenant de la solicitud. */
export const generateCaption = async (
  ctx: CaptionContext,
  input: CaptionRequest,
): Promise<Result<string, AppError>> => {
  const logger = createLogger({ module: 'post-generation', tenantId: ctx.tenantId, userId: ctx.userId });
  const env = loadServerEnv();
  const model = createVercelAiModel({ env, usage: createLogUsageRecorder(logger), logger });

  const { system, prompt } = buildCaptionPrompt(input);
  const res = await model.generate({
    task: 'copy',
    system,
    prompt,
    temperature: 0.85,
    maxOutputTokens: 500,
  });
  if (!res.ok) return res;
  return { ok: true, value: res.value.text.trim() };
};
