import type { Result } from '@/core/result';
import type { AppError } from '@/core/errors';

/**
 * Tareas de generacion soportadas. El router elige modelo por tarea.
 * `image` se enruta al modelo de imagen de Gemini (pipeline de imagen aparte).
 */
export type GenerationTask = 'copy' | 'script' | 'proposal' | 'dynamic' | 'image';

export interface GenerationRequest {
  readonly task: GenerationTask;
  readonly system: string;
  readonly prompt: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
}

/** Telemetria por llamada: tokens, latencia, proveedor/modelo. */
export interface UsageInfo {
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly latencyMs: number;
}

export interface GenerationResult {
  readonly text: string;
  readonly usage: UsageInfo;
}

/**
 * Puerto de modelo de lenguaje. El dominio depende de esta interfaz, nunca de
 * un SDK concreto. Cambiar de proveedor = nuevo adapter, sin tocar el dominio.
 */
export interface LanguageModelPort {
  /** Genera texto completo. Para flujos que necesitan validar el resultado. */
  generate(req: GenerationRequest): Promise<Result<GenerationResult, AppError>>;
  /** Genera en streaming (texto plano UTF-8) para respuestas en vivo. */
  stream(req: GenerationRequest): Promise<Result<ReadableStream<Uint8Array>, AppError>>;
}

/** Registro de uso (tokens/costo/latencia). Hoy a log; manana a tabla. */
export interface UsageRecorder {
  record(usage: UsageInfo, meta: { readonly task: GenerationTask }): void;
}
