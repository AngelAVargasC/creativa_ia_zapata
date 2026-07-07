'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { resolveSession } from '@/core/auth/resolve-session';
import { rateLimit, clientIp } from '@/core/rate-limit';
import { createOperador, setOperadorActive, deleteOperador } from '@/modules/operadores/service';

const str = (v: FormDataEntryValue | null): string => (typeof v === 'string' ? v : '');
const OPERADORES = '/admin/operadores' as Route;

/** Exige sesion admin. Redirige fuera si no lo es (defensa en el servidor). */
const requireAdmin = async (): Promise<void> => {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  if (session.value.role !== 'admin') redirect('/solicitudes' as Route);
};

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createOperadorAction = async (formData: FormData): Promise<void> => {
  await requireAdmin();

  const ip = await clientIp();
  if (!rateLimit(`op-create:${ip}`, 10, 10 * 60 * 1000).ok) {
    redirect(`${OPERADORES}?error=rate` as Route);
  }

  const parsed = createSchema.safeParse({
    email: str(formData.get('email')),
    password: str(formData.get('password')),
  });
  if (!parsed.success) redirect(`${OPERADORES}?error=invalid` as Route);

  const res = await createOperador(parsed.data.email, parsed.data.password);
  if (!res.ok) redirect(`${OPERADORES}?error=save` as Route);

  revalidatePath(OPERADORES);
  redirect(`${OPERADORES}?ok=created` as Route);
};

export const toggleOperadorAction = async (formData: FormData): Promise<void> => {
  await requireAdmin();
  const id = str(formData.get('id'));
  const active = str(formData.get('active')) === 'true'; // estado deseado
  if (!id) redirect(OPERADORES);

  const res = await setOperadorActive(id, active);
  if (!res.ok) redirect(`${OPERADORES}?error=save` as Route);

  revalidatePath(OPERADORES);
  redirect(OPERADORES);
};

export const deleteOperadorAction = async (formData: FormData): Promise<void> => {
  await requireAdmin();
  const id = str(formData.get('id'));
  if (!id) redirect(OPERADORES);

  const res = await deleteOperador(id);
  if (!res.ok) redirect(`${OPERADORES}?error=save` as Route);

  revalidatePath(OPERADORES);
  redirect(`${OPERADORES}?ok=deleted` as Route);
};
