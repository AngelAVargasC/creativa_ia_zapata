import 'server-only';
import { z } from 'zod';

/**
 * Validacion de entorno con Zod. Falla rapido y de forma explicita si una var
 * presente es invalida. Las claves de proveedor inactivo son opcionales (para
 * poder arrancar sin ellas) y se exigen en el punto de uso de cada adapter.
 */

/** Trata "" (variable presente pero vacia, comun al copiar .env.example) como ausente. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const stringWithDefault = (fallback: string) =>
  z.preprocess(emptyToUndefined, z.string().min(1).default(fallback));
const requiredString = (message: string) =>
  z.preprocess(emptyToUndefined, z.string({ required_error: message, invalid_type_error: message }).min(1, message));

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Proveedores de IA.
  // MODO ARRANQUE: solo Gemini esta activo -> su llave es la UNICA requerida.
  // Claude y OpenAI quedan OPCIONALES (soporte definido pero inactivo).
  GOOGLE_GENERATIVE_AI_API_KEY: requiredString(
    'GOOGLE_GENERATIVE_AI_API_KEY es requerida (unico proveedor activo)',
  ),
  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,

  // Modelos de Gemini (proveedor activo), config-driven.
  GEMINI_MODEL_TEXT: stringWithDefault('gemini-2.5-flash'),
  GEMINI_MODEL_IMAGE: stringWithDefault('imagen-4.0-generate-001'),
  GEMINI_MODEL_IMAGE_EDIT: stringWithDefault('gemini-2.5-flash-image'),

  // Modelos Claude (INACTIVOS en modo arranque; definidos para reactivar).
  AI_MODEL_HIGH: stringWithDefault('claude-opus-4-8'),
  AI_MODEL_BALANCED: stringWithDefault('claude-sonnet-4-6'),
  AI_MODEL_FAST: stringWithDefault('claude-haiku-4-5'),

  // Supabase: SOLO base de datos + Auth + RLS. NO se usa para imagenes.
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  // Cloudflare R2 (S3-compatible): almacenamiento de imagenes generadas por IA.
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  R2_PUBLIC_BASE_URL: optionalUrl,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Valida un objeto de entorno. Lanza con un mensaje claro si algo es invalido. */
export const parseServerEnv = (raw: unknown): ServerEnv => {
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuracion de entorno invalida -> ${issues}`);
  }
  return parsed.data;
};

let cached: ServerEnv | null = null;

/** Carga y valida el entorno del proceso una sola vez. */
export const loadServerEnv = (): ServerEnv => {
  if (!cached) cached = parseServerEnv(process.env);
  return cached;
};
