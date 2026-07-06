'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { credentialsSchema } from '@/modules/auth/schema';

/**
 * Inicia sesion con email/contrasena. Valida el borde con Zod; ante error
 * redirige a /login con un codigo (sin filtrar detalles). Al exito, la cookie
 * de sesion queda fijada por el server client y se redirige a la home.
 */
export const login = async (formData: FormData): Promise<void> => {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  // typedRoutes no tipa query strings: cast explicito al tipo Route.
  if (!parsed.success) redirect('/login?error=invalid' as Route);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect('/login?error=auth' as Route);

  revalidatePath('/', 'layout');
  redirect('/');
};

/** Cierra sesion y vuelve al login. */
export const logout = async (): Promise<void> => {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login' as Route);
};
