'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { rateLimit, clientIp } from '@/core/rate-limit';
import { registerSchema } from '@/modules/registro/schema';
import { registerAgency } from '@/modules/registro/service';

const str = (v: FormDataEntryValue | null): string => (typeof v === 'string' ? v : '');

/**
 * Registro abierto de una agencia. Rate-limited por IP para frenar abuso al
 * abrir el auto-servicio. Al exito, inicia sesion y entra al espacio de trabajo.
 */
export const registerAction = async (formData: FormData): Promise<void> => {
  const ip = await clientIp();
  const limited = rateLimit(`registro:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) redirect('/registro?error=rate' as Route);

  const mode = str(formData.get('mode')) === 'new' ? 'new' : 'existing';
  const parsed = registerSchema.safeParse({
    email: str(formData.get('email')),
    password: str(formData.get('password')),
    mode,
    agencyId: str(formData.get('agencyId')) || undefined,
    nombre: str(formData.get('nombre')) || undefined,
    address: str(formData.get('address')) || undefined,
  });
  if (!parsed.success) redirect('/registro?error=invalid' as Route);

  const res = await registerAgency(parsed.data);
  if (!res.ok) {
    const code = res.error.code === 'TENANT_FORBIDDEN' ? 'taken' : 'save';
    redirect(`/registro?error=${code}` as Route);
  }

  // Auto-login con las credenciales recien creadas.
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) redirect('/login?registered=1' as Route);

  revalidatePath('/', 'layout');
  redirect('/');
};
