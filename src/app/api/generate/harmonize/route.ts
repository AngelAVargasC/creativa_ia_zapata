import { NextRequest } from 'next/server';
import { AppError } from '@/core/errors';
import { jsonError } from '@/core/http';
import { resolveSession } from '@/core/auth/resolve-session';
import { getSolicitud } from '@/modules/solicitudes/repository';
import { harmonizeRequestSchema } from '@/modules/post-generation/schema';
import { harmonizeImage } from '@/modules/post-generation/harmonize';
import { uploadImage, isR2Configured } from '@/modules/post-editor/uploads';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  const session = await resolveSession();
  if (!session.ok) return jsonError(session.error);

  const raw: unknown = await req.json().catch(() => null);
  const parsed = harmonizeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(new AppError('VALIDATION', 'Payload invalido'), parsed.error.flatten());
  }

  if (parsed.data.solicitudId) {
    const sol = await getSolicitud(parsed.data.solicitudId);
    if (!sol.ok) return jsonError(sol.error);
  }

  const res = await harmonizeImage(parsed.data.image);
  if (!res.ok) return jsonError(res.error);

  const url = isR2Configured() ? await uploadImage(res.value, 'harmonized') : null;
  return Response.json({ dataUrl: url && url.ok ? url.value : res.value });
}
