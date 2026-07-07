import type { PautaOFeed, SolicitudStatus } from './schema';

/** Fila de `public.solicitudes`. */
export interface SolicitudRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly tipo_contenido: string;
  readonly descripcion: string;
  readonly informacion: string;
  readonly insumos: string;
  readonly pauta_o_feed: PautaOFeed | null;
  readonly segmentacion_geografica: string;
  readonly status: SolicitudStatus;
  readonly link_final: string;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_by: string | null;
  readonly updated_at: string;
}

/** Fila con el nombre de la agencia embebido (vista de staff). */
export interface SolicitudWithAgency extends SolicitudRow {
  readonly agencia_nombre: string;
}

/** Fila de `public.solicitud_eventos` (bitacora inmutable). */
export interface SolicitudEvento {
  readonly id: string;
  readonly solicitud_id: string;
  readonly tenant_id: string;
  readonly changed_by: string | null;
  readonly changed_role: string | null;
  readonly action: string;
  readonly field: string | null;
  readonly old_value: string | null;
  readonly new_value: string | null;
  readonly created_at: string;
}
