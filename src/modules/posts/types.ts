import type { PostStatus } from './schema';

/** Fila completa de `public.posts` (incluye el diseño). */
export interface PostRow {
  readonly id: string;
  readonly title: string;
  readonly tenant_id: string | null;
  readonly solicitud_id: string | null;
  readonly design: unknown; // JSON del editor (se castea a Design en el cliente)
  readonly caption: string;
  readonly status: PostStatus;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_by: string | null;
  readonly updated_at: string;
}

/** Fila ligera para la biblioteca (sin el diseño pesado). */
export interface PostListItem {
  readonly id: string;
  readonly title: string;
  readonly status: PostStatus;
  readonly tenant_id: string | null;
  readonly solicitud_id: string | null;
  readonly updated_at: string;
  readonly created_at: string;
  readonly agencia_nombre: string | null;
}
