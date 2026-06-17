import 'server-only';
import { z } from 'zod';

/**
 * Validacion de entorno con Zod. Falla rapido y de forma explicita si una var
 * presente es invalida. Las claves de proveedor son opcionales aqui (para poder
 * compilar/testear sin secretos) y se exigen en el punto de uso de cada adapter.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Proveedores de IA.
  // MODO ARRANQUE: solo Gemini esta activo -> su llave es la UNICA requerida
  // (falla rapido si falta). Claude y OpenAI quedan OPCIONALES: soporte definido
  // pero inactivo, reactivable rellenando su llave y enrutando en routeModel.
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1, 'GOOGLE_GENERATIVE_AI_API_KEY es requerida (unico proveedor activo)'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Modelos de Gemini (proveedor activo), config-driven.
  GEMINI_MODEL_TEXT: z.string().min(1).default('gemini-2.5-flash'),
  GEMINI_MODEL_IMAGE: z.string().min(1).default('imagen-3.0-generate-002'),

  // Modelos Claude (INACTIVOS en modo arranque; definidos para reactivar).
  AI_MODEL_HIGH: z.string().min(1).default('claude-opus-4-8'),
  AI_MODEL_BALANCED: z.string().min(1).default('claude-sonnet-4-6'),
  AI_MODEL_FAST: z.string().min(1).default('claude-haiku-4-5'),

  // Supabase: SOLO base de datos + Auth + RLS. NO se usa para imagenes.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Cloudflare R2 (S3-compatible): almacenamiento de imagenes generadas por IA.
  // Se elige por egress $0 -> mucho mas barato a escala para servir imagenes.
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Carga y valida el entorno una sola vez. Lanza si hay una var invalida. */
export const loadServerEnv = (): ServerEnv => {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuracion de entorno invalida -> ${issues}`);
  }
  cached = parsed.data;
  return cached;
};
