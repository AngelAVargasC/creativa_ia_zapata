'use server';

import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import {
  createSolicitudSchema,
  solicitanteUpdateSchema,
  staffUpdateSchema,
} from '@/modules/solicitudes/schema';
import {
  createSolicitud,
  deleteSolicitud,
  updateSolicitudSolicitante,
  updateSolicitudStaff,
} from '@/modules/solicitudes/repository';

/** Normaliza un campo de texto del form (null/'' -> ''). */
const str = (v: FormDataEntryValue | null): string => (typeof v === 'string' ? v : '');
/** Texto opcional del form: undefined si el campo no vino, string (incl. '') si vino. */
const optStr = (fd: FormData, key: string): string | undefined =>
  fd.get(key) === null ? undefined : str(fd.get(key));

/**
 * Crea una solicitud. El solicitante la crea para SU agencia; el staff puede
 * crearla en nombre de una agencia (tenant_id del form). RLS revalida.
 */
export const createSolicitudAction = async (formData: FormData): Promise<void> => {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);

  const parsed = createSolicitudSchema.safeParse({
    tipo_contenido: str(formData.get('tipo_contenido')),
    descripcion: str(formData.get('descripcion')),
    informacion: str(formData.get('informacion')),
    insumos: str(formData.get('insumos')),
    formato: str(formData.get('formato')),
    segmentacion_geografica: str(formData.get('segmentacion_geografica')),
  });
  if (!parsed.success) redirect('/solicitudes/nueva?error=invalid' as Route);

  const staff = isStaffRole(session.value.role);
  const tenantId = staff ? str(formData.get('tenant_id')) : session.value.tenantId;
  if (!tenantId) redirect('/solicitudes/nueva?error=agencia' as Route);

  const res = await createSolicitud(tenantId, parsed.data);
  if (!res.ok) redirect('/solicitudes/nueva?error=save' as Route);

  revalidatePath('/solicitudes' as Route);
  redirect(`/solicitudes/${res.value.id}` as Route);
};

/**
 * Actualiza una solicitud. El schema y los campos permitidos dependen del rol;
 * los triggers de la BD son la ultima linea de defensa.
 */
export const updateSolicitudAction = async (formData: FormData): Promise<void> => {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);

  const id = str(formData.get('id'));
  if (!id) redirect('/solicitudes' as Route);

  const target = `/solicitudes/${id}` as Route;
  const staff = isStaffRole(session.value.role);

  if (staff) {
    const parsed = staffUpdateSchema.safeParse({
      status: str(formData.get('status')) || undefined,
      link_final: optStr(formData, 'link_final'),
      tipo_contenido: str(formData.get('tipo_contenido')) || undefined,
      descripcion: optStr(formData, 'descripcion'),
      informacion: optStr(formData, 'informacion'),
      insumos: optStr(formData, 'insumos'),
      formato: optStr(formData, 'formato'),
      segmentacion_geografica: optStr(formData, 'segmentacion_geografica'),
      comentarios: optStr(formData, 'comentarios'),
      copy_out: optStr(formData, 'copy_out'),
      pautado: formData.get('pautado') === null ? undefined : formData.get('pautado') === 'true',
    });
    if (!parsed.success) redirect(`${target}?error=invalid` as Route);
    const res = await updateSolicitudStaff(id, parsed.data);
    if (!res.ok) redirect(`${target}?error=forbidden` as Route);
  } else {
    const parsed = solicitanteUpdateSchema.safeParse({
      tipo_contenido: str(formData.get('tipo_contenido')) || undefined,
      descripcion: optStr(formData, 'descripcion'),
      informacion: optStr(formData, 'informacion'),
      insumos: optStr(formData, 'insumos'),
      formato: optStr(formData, 'formato'),
      segmentacion_geografica: optStr(formData, 'segmentacion_geografica'),
    });
    if (!parsed.success) redirect(`${target}?error=invalid` as Route);
    const res = await updateSolicitudSolicitante(id, parsed.data);
    if (!res.ok) redirect(`${target}?error=forbidden` as Route);
  }

  revalidatePath(target);
  revalidatePath('/solicitudes' as Route);
  redirect(`${target}?ok=1` as Route);
};

/** Elimina una solicitud (RLS: staff, o dueño mientras 'nueva'). */
export const deleteSolicitudAction = async (formData: FormData): Promise<void> => {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);

  const id = str(formData.get('id'));
  if (!id) redirect('/solicitudes' as Route);

  const res = await deleteSolicitud(id);
  if (!res.ok) redirect(`/solicitudes/${id}?error=forbidden` as Route);

  revalidatePath('/solicitudes' as Route);
  redirect('/solicitudes' as Route);
};
