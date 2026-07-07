import { z } from 'zod';

/** Enums espejo de los tipos SQL (migracion 0003). */
export const pautaOFeedSchema = z.enum(['pauta', 'feed']);
export type PautaOFeed = z.infer<typeof pautaOFeedSchema>;

export const solicitudStatusSchema = z.enum([
  'nueva',
  'en_proceso',
  'en_revision',
  'requiere_info',
  'lista',
  'publicada',
  'cancelada',
]);
export type SolicitudStatus = z.infer<typeof solicitudStatusSchema>;

/** Alta de solicitud (lo que llena la agencia). Mapea las columnas del Excel. */
export const createSolicitudSchema = z.object({
  tipo_contenido: z.string().trim().min(2, 'Indica el tipo de contenido').max(120),
  descripcion: z.string().trim().max(2000).default(''),
  informacion: z.string().trim().max(4000).default(''),
  insumos: z.string().trim().max(2000).default(''),
  pauta_o_feed: pautaOFeedSchema.optional(),
  segmentacion_geografica: z.string().trim().max(500).default(''),
});
export type CreateSolicitudInput = z.infer<typeof createSolicitudSchema>;

/** Edicion del solicitante: solo SUS campos (nunca status ni link_final). */
export const solicitanteUpdateSchema = createSolicitudSchema.partial();
export type SolicitanteUpdateInput = z.infer<typeof solicitanteUpdateSchema>;

/** Edicion de staff (operador/admin): status, link_final y correccion de datos. */
export const staffUpdateSchema = z.object({
  status: solicitudStatusSchema.optional(),
  link_final: z.string().trim().max(1000).optional(),
  tipo_contenido: z.string().trim().min(2).max(120).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  informacion: z.string().trim().max(4000).optional(),
  insumos: z.string().trim().max(2000).optional(),
  pauta_o_feed: pautaOFeedSchema.optional(),
  segmentacion_geografica: z.string().trim().max(500).optional(),
});
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
