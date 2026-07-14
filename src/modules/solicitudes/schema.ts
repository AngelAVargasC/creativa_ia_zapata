import { z } from 'zod';

/** Catálogo de estatus (flujo real del equipo). Se valida aquí; en la BD es texto. */
export const solicitudStatusSchema = z.enum([
  'nueva',
  'en_correccion',
  'en_produccion',
  'esperando_aprobacion',
  'lista',
  'publicada',
  'cancelada',
]);
export type SolicitudStatus = z.infer<typeof solicitudStatusSchema>;

/** Formato de salida (texto libre con sugerencias): Feed, Pauta, Story, Reel… */
export const formatoSchema = z.string().trim().max(60);

/** Alta de solicitud (lo que llena la agencia). Mapea las columnas del Excel. */
export const createSolicitudSchema = z.object({
  tipo_contenido: z.string().trim().min(2, 'Indica el tipo de contenido').max(120),
  descripcion: z.string().trim().max(2000).default(''),
  informacion: z.string().trim().max(4000).default(''),
  insumos: z.string().trim().max(2000).default(''),
  formato: formatoSchema.default(''),
  segmentacion_geografica: z.string().trim().max(500).default(''),
});
export type CreateSolicitudInput = z.infer<typeof createSolicitudSchema>;

/** Edicion del solicitante: solo SUS campos (nunca status ni link_final). */
export const solicitanteUpdateSchema = createSolicitudSchema.partial();
export type SolicitanteUpdateInput = z.infer<typeof solicitanteUpdateSchema>;

/** Edicion de staff (operador/admin): status, entrega y correccion de datos. */
export const staffUpdateSchema = z.object({
  status: solicitudStatusSchema.optional(),
  link_final: z.string().trim().max(1000).optional(),
  tipo_contenido: z.string().trim().min(2).max(120).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  informacion: z.string().trim().max(4000).optional(),
  insumos: z.string().trim().max(2000).optional(),
  formato: formatoSchema.optional(),
  segmentacion_geografica: z.string().trim().max(500).optional(),
  comentarios: z.string().trim().max(2000).optional(),
  copy_out: z.string().trim().max(4000).optional(),
  pautado: z.boolean().optional(),
});
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
