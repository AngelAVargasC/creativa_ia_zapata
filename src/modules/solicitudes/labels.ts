import type { SolicitudStatus } from './schema';

/** Etiqueta legible + tono visual por estatus (para chips/badges). */
export const STATUS_META: Record<SolicitudStatus, { readonly label: string; readonly tone: string }> = {
  nueva: { label: 'Nueva', tone: 'neutral' },
  en_proceso: { label: 'En proceso', tone: 'info' },
  en_revision: { label: 'En revisión', tone: 'warn' },
  requiere_info: { label: 'Requiere info', tone: 'warn' },
  lista: { label: 'Lista', tone: 'ok' },
  publicada: { label: 'Publicada', tone: 'ok' },
  cancelada: { label: 'Cancelada', tone: 'muted' },
};

/** Orden de aparicion en filtros/tableros (flujo natural). */
export const STATUS_ORDER: readonly SolicitudStatus[] = [
  'nueva',
  'en_proceso',
  'en_revision',
  'requiere_info',
  'lista',
  'publicada',
  'cancelada',
];

/** Etiqueta legible de cada campo (para la bitacora de cambios). */
export const FIELD_LABELS: Record<string, string> = {
  tipo_contenido: 'Tipo de contenido',
  descripcion: 'Descripción',
  informacion: 'Información',
  insumos: 'Insumos',
  pauta_o_feed: '¿Pauta o feed?',
  segmentacion_geografica: 'Segmentación geográfica',
  status: 'Estatus',
  link_final: 'Link final',
};

export const fieldLabel = (field: string | null): string =>
  field ? (FIELD_LABELS[field] ?? field) : '';
