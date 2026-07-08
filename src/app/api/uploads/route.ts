import { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/core/errors';
import { jsonError } from '@/core/http';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { uploadImage } from '@/modules/post-editor/uploads';

export const runtime = 'nodejs';
export const maxDuration = 30;

const bodySchema = z.object({ dataUrl: z.string().min(50) });

/** Sube una imagen (dataURL) a R2 y devuelve su URL pública. Solo staff. */
export async function POST(req: NextRequest): Promise<Response> {
  const session = await resolveSession();
  if (!session.ok || !isStaffRole(session.value.role)) {
    return jsonError(new AppError('TENANT_FORBIDDEN', 'No autorizado'));
  }

  const raw: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(new AppError('VALIDATION', 'Payload invalido'));

  const res = await uploadImage(parsed.data.dataUrl);
  if (!res.ok) return jsonError(res.error);
  return Response.json({ url: res.value });
}
