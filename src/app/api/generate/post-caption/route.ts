import { NextRequest } from 'next/server';
import { AppError } from '@/core/errors';
import { jsonError } from '@/core/http';
import { resolveSession } from '@/core/auth/resolve-session';
import { getSolicitud } from '@/modules/solicitudes/repository';
import { captionRequestSchema } from '@/modules/post-generation/schema';
import { generateCaption } from '@/modules/post-generation/caption';

// Usa cookies/Supabase + SDK de IA -> runtime Node.
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  // 1) Identidad desde la sesion del servidor.
  const session = await resolveSession();
  if (!session.ok) return jsonError(session.error);

  // 2) Validacion del payload.
  const raw: unknown = await req.json().catch(() => null);
  const parsed = captionRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(new AppError('VALIDATION', 'Payload invalido'), parsed.error.flatten());
  }

  // 3) Si hay solicitud, resuelve el tenant y valida el acceso (RLS).
  let tenantId = 'estudio';
  if (parsed.data.solicitudId) {
    const sol = await getSolicitud(parsed.data.solicitudId);
    if (!sol.ok) return jsonError(sol.error);
    tenantId = sol.value.tenant_id;
  }

  // 4) Generar caption.
  const res = await generateCaption({ tenantId, userId: session.value.userId }, parsed.data);
  if (!res.ok) return jsonError(res.error);

  return Response.json({ text: res.value });
}
