import 'server-only';
import { headers } from 'next/headers';

/**
 * Rate limiter de ventana fija en memoria de proceso. Suficiente para frenar
 * abuso/fuerza bruta en login, registro y creacion de cuentas en un despliegue
 * de una sola instancia. Para multi-instancia/serverless conviene migrar a un
 * store compartido (Upstash/Redis); la interfaz no cambiaria.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  readonly ok: boolean;
  readonly retryAfterSec: number;
}

/** Consume 1 del cupo de `key`. `ok=false` si se excedio `limit` en `windowMs`. */
export const rateLimit = (key: string, limit: number, windowMs: number): RateLimitResult => {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
};

/** IP del cliente a partir de las cabeceras del proxy (best-effort). */
export const clientIp = async (): Promise<string> => {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return h.get('x-real-ip') ?? 'unknown';
};
