'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { savePostSchema, type SavePostInput } from '@/modules/posts/schema';
import { upsertPost, deletePost } from '@/modules/posts/repository';

/** Guarda (crea/actualiza) un post del estudio. Devuelve el id para el editor. */
export const savePostAction = async (
  input: SavePostInput,
): Promise<{ ok: boolean; id?: string; error?: string }> => {
  const session = await resolveSession();
  if (!session.ok || !isStaffRole(session.value.role)) return { ok: false, error: 'No autorizado' };

  const parsed = savePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const res = await upsertPost(parsed.data);
  if (!res.ok) return { ok: false, error: res.error.message };

  revalidatePath('/biblioteca' as Route);
  return { ok: true, id: res.value };
};

/** Elimina un post desde la biblioteca. */
export const deletePostAction = async (formData: FormData): Promise<void> => {
  const session = await resolveSession();
  if (!session.ok || !isStaffRole(session.value.role)) redirect('/solicitudes' as Route);

  const id = typeof formData.get('id') === 'string' ? String(formData.get('id')) : '';
  if (id) await deletePost(id);

  revalidatePath('/biblioteca' as Route);
  redirect('/biblioteca' as Route);
};
