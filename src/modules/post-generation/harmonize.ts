import 'server-only';
import { loadServerEnv } from '@/config/env';
import { AppError, toAppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';

const HARMONIZE_PROMPT = [
  'Retoca esta imagen de un auto en venta para que la iluminación, el color y el contraste del auto se integren de forma natural y realista con el fondo,',
  'como una fotografía publicitaria profesional de estudio automotriz.',
  'Añade una sombra de contacto suave y realista debajo del vehículo y unifica la temperatura de color de toda la escena.',
  'Mantén EXACTAMENTE la posición, el ángulo, la forma y el encuadre del auto: no lo muevas ni lo deformes.',
  'No agregues texto, logos, marcas de agua ni elementos nuevos. Devuelve solo la imagen retocada.',
].join(' ');

interface EditResponse {
  candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
}

/**
 * Homogeneiza la capa fotográfica (auto + fondo) con el modelo de edición de
 * imagen de Gemini, para que el auto no se vea "pegado". Recibe base64 (sin
 * prefijo) y devuelve un dataURL listo para usar como fondo del diseño.
 */
export const harmonizeImage = async (imageBase64: string): Promise<Result<string, AppError>> => {
  const env = loadServerEnv();
  const key = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    return err(new AppError('PROVIDER_UNAVAILABLE', 'La edición con IA no está configurada (falta GOOGLE_GENERATIVE_AI_API_KEY).'));
  }

  const model = env.GEMINI_MODEL_IMAGE_EDIT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/png', data: imageBase64 } },
              { text: HARMONIZE_PROMPT },
            ],
          },
        ],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (res.status === 403 || res.status === 429) {
        return err(new AppError('PROVIDER_ERROR', 'El retoque con IA no está disponible para tu API key (cuota/facturación).'));
      }
      return err(new AppError('PROVIDER_ERROR', `El modelo respondió ${res.status}: ${detail.slice(0, 300)}`));
    }

    const data = (await res.json()) as EditResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inlineData?.data);
    const b64 = imgPart?.inlineData?.data;
    if (!b64) {
      return err(new AppError('PROVIDER_ERROR', 'El modelo no devolvió una imagen retocada. Intenta de nuevo.'));
    }
    return ok(`data:${imgPart?.inlineData?.mimeType ?? 'image/png'};base64,${b64}`);
  } catch (e) {
    return err(toAppError(e, 'PROVIDER_ERROR'));
  }
};
