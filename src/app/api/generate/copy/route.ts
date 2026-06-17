import { NextRequest } from 'next/server';
import { AppError } from '@/core/errors';
import { jsonError } from '@/core/http';
import { resolveTenant } from '@/core/auth/resolve-tenant';
import { generateCopyRequestSchema } from '@/modules/content-generation/schema';
import { runGenerateCopy, streamGenerateCopy } from '@/modules/content-generation/application/copy-service';

// Usa cookies/Supabase -> runtime Node, no Edge.
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  // 1) Tenant SIEMPRE desde la sesion del servidor, nunca desde el cliente.
  const tenant = await resolveTenant();
  if (!tenant.ok) return jsonError(tenant.error);

  // 2) Validacion estricta del payload en el borde.
  const raw: unknown = await req.json().catch(() => null);
  const parsed = generateCopyRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(new AppError('VALIDATION', 'Payload invalido'), parsed.error.flatten());
  }

  const input = { tenant: tenant.value, brand: parsed.data.brand, brief: parsed.data.brief };
  const wantsStream = req.nextUrl.searchParams.get('stream') === '1';

  // 3a) Streaming en vivo (texto plano).
  if (wantsStream) {
    const res = await streamGenerateCopy(input);
    if (!res.ok) return jsonError(res.error);
    return new Response(res.value, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  // 3b) Generacion completa con validacion de reglas de marca.
  const res = await runGenerateCopy(input);
  if (!res.ok) return jsonError(res.error);
  return Response.json({ text: res.value.text, usage: res.value.usage });
}
