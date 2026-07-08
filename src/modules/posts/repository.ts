import 'server-only';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { PostRow, PostListItem } from './types';
import type { SavePostInput } from './schema';

type AgencyEmbed = { name: string } | { name: string }[] | null;

const agencyName = (embed: AgencyEmbed): string | null => {
  const n = Array.isArray(embed) ? embed[0]?.name : embed?.name;
  return n ?? null;
};

/** Lista los posts visibles (RLS: staff). Sin el diseño pesado. */
export const listPosts = async (): Promise<Result<PostListItem[], AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, status, tenant_id, solicitud_id, updated_at, created_at, agencies(name)')
    .order('updated_at', { ascending: false });
  if (error) return err(new AppError('UNKNOWN', `No se pudieron cargar los posts: ${error.message}`));
  const rows = (data ?? []) as (Omit<PostListItem, 'agencia_nombre'> & { agencies?: AgencyEmbed })[];
  return ok(rows.map((r) => ({ ...r, agencia_nombre: agencyName(r.agencies ?? null) })));
};

/** Un post completo (con diseño) por id. */
export const getPost = async (id: string): Promise<Result<PostRow, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  if (error) return err(new AppError('UNKNOWN', error.message));
  if (!data) return err(new AppError('NOT_FOUND', 'Post no encontrado'));
  return ok(data as PostRow);
};

/** Crea o actualiza un post. Devuelve el id (para el editor). */
export const upsertPost = async (input: SavePostInput): Promise<Result<string, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const payload = {
    title: input.title,
    tenant_id: input.tenantId ?? null,
    solicitud_id: input.solicitudId ?? null,
    caption: input.caption,
    status: input.status,
    design: input.design as never,
  };

  if (input.id) {
    const { data, error } = await supabase.from('posts').update(payload).eq('id', input.id).select('id').single();
    if (error) return err(new AppError('TENANT_FORBIDDEN', error.message));
    return ok((data as { id: string }).id);
  }

  const { data, error } = await supabase.from('posts').insert(payload).select('id').single();
  if (error) return err(new AppError('TENANT_FORBIDDEN', `No se pudo guardar: ${error.message}`));
  return ok((data as { id: string }).id);
};

/** Elimina un post. */
export const deletePost = async (id: string): Promise<Result<true, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return err(new AppError('TENANT_FORBIDDEN', error.message));
  return ok(true);
};
