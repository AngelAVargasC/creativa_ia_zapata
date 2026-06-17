import type { AppError, ErrorCode } from '@/core/errors';

/** Mapea codigos de error de dominio a estados HTTP. Capa de transporte. */
export const statusFor = (code: ErrorCode): number => {
  switch (code) {
    case 'VALIDATION':
      return 400;
    case 'TENANT_FORBIDDEN':
      return 401;
    case 'NOT_FOUND':
      return 404;
    case 'PROVIDER_UNAVAILABLE':
      return 503;
    case 'PROVIDER_ERROR':
      return 502;
    case 'UNKNOWN':
      return 500;
  }
};

/** Respuesta de error JSON consistente. Nunca exponemos `cause` al cliente. */
export const jsonError = (error: AppError, details?: unknown): Response =>
  Response.json(
    { error: { code: error.code, message: error.message, details: details ?? null } },
    { status: statusFor(error.code) },
  );
