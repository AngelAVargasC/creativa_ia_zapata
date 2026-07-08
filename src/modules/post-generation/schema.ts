import { z } from 'zod';

/**
 * Datos para generar el caption de un post promocional de auto (estilo Go On).
 * El tenant NO viaja aqui: se resuelve en el servidor desde la solicitud.
 */
export const captionRequestSchema = z.object({
  solicitudId: z.string().uuid().optional(),
  modelo: z.string().trim().min(1, 'Indica el modelo').max(160),
  tagline: z.string().trim().max(160).default(''),
  precioAntes: z.string().trim().max(40).default(''),
  precioAhora: z.string().trim().max(40).default(''),
  spec: z.string().trim().max(300).default(''),
  extra: z.string().trim().max(300).default(''),
  // Info cruda de la solicitud (opcional): la IA la usa como fuente de datos.
  info: z.string().trim().max(4000).default(''),
});

export type CaptionRequest = z.infer<typeof captionRequestSchema>;

/** Generación de fondo con IA (Imagen). El aspect mapea al formato del artboard. */
export const backgroundRequestSchema = z.object({
  solicitudId: z.string().uuid().optional(),
  prompt: z.string().trim().min(4).max(1200),
  aspect: z.enum(['1:1', '4:5', '9:16', '16:9', '4:3']).default('1:1'),
});

export type BackgroundRequest = z.infer<typeof backgroundRequestSchema>;

/** Retoque/homogeneización de la capa fotográfica (imagen base64, sin prefijo dataURL). */
export const harmonizeRequestSchema = z.object({
  solicitudId: z.string().uuid().optional(),
  image: z.string().min(100), // base64 PNG (sin "data:image/png;base64,")
});

export type HarmonizeRequest = z.infer<typeof harmonizeRequestSchema>;
