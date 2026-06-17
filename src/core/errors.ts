/**
 * Errores de dominio explicitos y tipados. Nunca silenciamos un error:
 * lo modelamos con un codigo estable que la capa de transporte mapea a HTTP.
 */
export type ErrorCode =
  | 'VALIDATION'
  | 'TENANT_FORBIDDEN'
  | 'NOT_FOUND'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: ErrorCode;
  override readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

/** Normaliza cualquier valor capturado a un AppError tipado. */
export const toAppError = (e: unknown, fallback: ErrorCode = 'UNKNOWN'): AppError => {
  if (isAppError(e)) return e;
  if (e instanceof Error) return new AppError(fallback, e.message, e);
  return new AppError(fallback, 'Error desconocido', e);
};
