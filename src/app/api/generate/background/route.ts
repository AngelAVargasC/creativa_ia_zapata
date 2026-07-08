import { NextRequest } from 'next/server';
import { AppError } from '@/core/errors';
import { jsonError } from '@/core/http';
import { resolveSession } from '@/core/auth/resolve-session';
import { getSolicitud } from '@/modules/solicitudes/repository';
import { backgroundRequestSchema } from '@/modules/post-generation/schema';
import { generateBackground } from '@/modules/post-generation/background';
import { uploadImage, isR2Configured } from '@/modules/post-editor/uploads';

export const runtime = 'nodejs';
// La generación de imagen puede tardar; damos margen.
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  const session = await resolveSession();
  if (!session.ok) return jsonError(session.error);

  const raw: unknown = await req.json().catch(() => null);
  const parsed = backgroundRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(new AppError('VALIDATION', 'Payload invalido'), parsed.error.flatten());
  }

  // Si hay solicitud, valida acceso (RLS) antes de gastar en generación.
  if (parsed.data.solicitudId) {
    const sol = await getSolicitud(parsed.data.solicitudId);
    if (!sol.ok) return jsonError(sol.error);
  }

  const res = await generateBackground(parsed.data);
  if (!res.ok) return jsonError(res.error);

  // Sube a R2 para no arrastrar base64 pesado en el diseño; si R2 no está
  // configurado o falla, devuelve el base64 (degradación con gracia).
  const url = isR2Configured() ? await uploadImage(res.value, 'backgrounds') : null;
  return Response.json({ dataUrl: url && url.ok ? url.value : res.value });
}
