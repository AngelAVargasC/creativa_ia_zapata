import 'server-only';
import { loadServerEnv } from '@/config/env';
import { AppError, toAppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { BackgroundRequest } from './schema';

/** Formatos del artboard -> aspect ratios soportados por Imagen. */
const ASPECT: Record<BackgroundRequest['aspect'], string> = {
  '1:1': '1:1',
  '4:5': '3:4',
  '9:16': '9:16',
  '16:9': '16:9',
  '4:3': '4:3',
};

interface ImagenResponse {
  predictions?: { bytesBase64Encoded?: string; mimeType?: string }[];
}

/**
 * Genera un fondo (sin auto) con Imagen del Gemini API, llamado directamente por
 * REST (el @ai-sdk/google instalado no expone modelos de imagen). Degrada con
 * gracia: si falta la clave o Imagen no está habilitado, devuelve un error claro
 * y el editor sigue ofreciendo fondos procedurales.
 */
export const generateBackground = async (input: BackgroundRequest): Promise<Result<string, AppError>> => {
  const env = loadServerEnv();
  const key = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    return err(new AppError('PROVIDER_UNAVAILABLE', 'La generación de imágenes no está configurada (falta GOOGLE_GENERATIVE_AI_API_KEY).'));
  }

  const model = env.GEMINI_MODEL_IMAGE; // p.ej. imagen-3.0-generate-002
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        instances: [{ prompt: input.prompt }],
        parameters: { sampleCount: 1, aspectRatio: ASPECT[input.aspect] },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (res.status === 403 || res.status === 429) {
        return err(
          new AppError(
            'PROVIDER_ERROR',
            'Imagen no está disponible para tu API key (requiere facturación activa en Google AI Studio / cuota). Mientras tanto usa los fondos rápidos.',
          ),
        );
      }
      return err(new AppError('PROVIDER_ERROR', `Imagen respondió ${res.status}: ${detail.slice(0, 300)}`));
    }

    const data = (await res.json()) as ImagenResponse;
    const pred = data.predictions?.[0];
    if (!pred?.bytesBase64Encoded) {
      return err(new AppError('PROVIDER_ERROR', 'La respuesta de Imagen no incluyó imagen. Verifica que el modelo esté habilitado para tu clave.'));
    }
    return ok(`data:${pred.mimeType ?? 'image/png'};base64,${pred.bytesBase64Encoded}`);
  } catch (e) {
    return err(toAppError(e, 'PROVIDER_ERROR'));
  }
};
