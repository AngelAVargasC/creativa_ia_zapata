import type { SolicitudStatus } from './schema';

/** Etiqueta legible + tono semáforo por estatus (flujo real del equipo). */
export const STATUS_META: Record<SolicitudStatus, { readonly label: string; readonly tone: string }> = {
  nueva: { label: 'Nueva', tone: 'neutral' },
  en_correccion: { label: 'En corrección', tone: 'danger' },
  en_produccion: { label: 'En producción', tone: 'info' },
  esperando_aprobacion: { label: 'Esperando aprobación', tone: 'warn' },
  lista: { label: 'Lista', tone: 'ok' },
  publicada: { label: 'Publicada', tone: 'ok' },
  cancelada: { label: 'Cancelada', tone: 'muted' },
};

/** Orden de aparicion en selects/tableros (flujo natural). */
export const STATUS_ORDER: readonly SolicitudStatus[] = [
  'nueva',
  'en_correccion',
  'en_produccion',
  'esperando_aprobacion',
  'lista',
  'publicada',
  'cancelada',
];

/** Sugerencias de tipo de contenido (catálogo Go On; el campo es texto libre). */
export const TIPO_CONTENIDO_SUGERENCIAS: readonly string[] = [
  'Posteo de feed',
  'Story',
  'Reel',
  'Carrusel',
  'Edición de microperforados',
  'Diseño para impresión',
  'Always on (ubicación)',
  'Viejas de casa',
  'Unidades +100 días',
  'Compramos tu auto',
  'Toma de unidades',
  'Feria',
];

/** Sugerencias de formato de salida (texto libre). */
export const FORMATO_SUGERENCIAS: readonly string[] = [
  'Feed',
  'Pauta',
  'Story',
  'Reel',
  'Carrusel',
  'Material para impresión',
];

/** Etiqueta legible de cada campo (para la bitácora de cambios). */
export const FIELD_LABELS: Record<string, string> = {
  tipo_contenido: 'Tipo de contenido',
  descripcion: 'Descripción',
  informacion: 'Información',
  insumos: 'Insumos',
  formato: 'Formato',
  segmentacion_geografica: 'Segmentación geográfica',
  status: 'Estatus',
  link_final: 'Link final',
  comentarios: 'Comentarios',
  copy_out: 'Copy out',
  pautado: '¿Pautado?',
};

export const fieldLabel = (field: string | null): string =>
  field ? (FIELD_LABELS[field] ?? field) : '';

/** Etiqueta segura para un status (tolera valores antiguos en datos previos). */
export const statusLabel = (status: string): { label: string; tone: string } =>
  STATUS_META[status as SolicitudStatus] ?? { label: status, tone: 'neutral' };
