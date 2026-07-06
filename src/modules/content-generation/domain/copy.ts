/**
 * Dominio puro de generacion de copy. Sin IO, sin framework: solo reglas de
 * negocio y construccion de prompt. 100% testeable de forma aislada.
 */
export type Platform = 'facebook' | 'instagram';
export type Tone = 'cercano' | 'profesional' | 'divertido' | 'inspirador';

/** Perfil de marca del tenant (agencia), sobre los lineamientos del Grupo. */
export interface BrandProfile {
  readonly agencyName: string;
  /** Lineamientos de voz/estilo de la marca. */
  readonly voice: string;
  /** Palabras o frases prohibidas por la marca. */
  readonly bannedWords: readonly string[];
}

export interface CopyBrief {
  readonly platform: Platform;
  readonly objective: string;
  readonly tone: Tone;
  readonly product: string;
  readonly maxChars: number;
}

const platformLabel: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
};

const platformGuidance: Record<Platform, string> = {
  instagram:
    'Instagram: lenguaje visual y cercano; gancho fuerte arriba; puedes usar 1-3 emojis con intención y cerrar con 3-5 hashtags específicos (nada genérico).',
  facebook:
    'Facebook: frases algo más desarrolladas y conversacionales; 0-2 emojis; sin hashtags; remata con una llamada a la acción clara.',
};

/**
 * Presupuesto de tokens de salida en función del límite de caracteres pedido.
 * Generoso (con holgura) para que el copy nunca se corte a media frase.
 */
export const tokenBudgetFor = (maxChars: number): number => Math.min(4096, Math.ceil(maxChars / 2) + 600);

/** Construye el (system, prompt) a partir de la marca y el brief. Determinista. */
export const buildCopyPrompt = (brand: BrandProfile, brief: CopyBrief): { system: string; prompt: string } => {
  const banned =
    brand.bannedWords.length > 0
      ? `Nunca uses estas palabras o frases: ${brand.bannedWords.join(', ')}.`
      : '';

  const system = [
    `Eres un redactor publicitario senior de la agencia "${brand.agencyName}", experto en social media de alto rendimiento.`,
    `Voz de marca: ${brand.voice}.`,
    `Escribes copy en español que detiene el scroll: un gancho potente en la primera línea, una idea clara, beneficio concreto, emoción real y una llamada a la acción que invita a actuar.`,
    `Nada de relleno corporativo ni clichés vacíos ("descubre la excelencia", "somos líderes", "lo mejor en…", "presentamos nuestro más reciente"). Sé específico, fresco, con ritmo y personalidad.`,
    banned,
  ]
    .filter(Boolean)
    .join(' ');

  const prompt = [
    `Plataforma: ${platformLabel[brief.platform]}.`,
    platformGuidance[brief.platform],
    `Producto/servicio: ${brief.product}.`,
    `Objetivo de la pieza: ${brief.objective}.`,
    `Tono: ${brief.tone}.`,
    `Aprovecha hasta ${brief.maxChars} caracteres sin pasarte; prioriza impacto sobre longitud, pero entrega una pieza completa (nunca la dejes a medias).`,
    `Devuelve SOLO el texto del copy listo para publicar, sin comillas, sin etiquetas ni explicaciones.`,
  ].join('\n');

  return { system, prompt };
};

/**
 * Verifica que el texto generado respete los lineamientos de marca.
 * Devuelve la lista de palabras prohibidas encontradas (vacia = cumple).
 */
export const findBrandViolations = (brand: BrandProfile, text: string): readonly string[] => {
  const haystack = text.toLowerCase();
  return brand.bannedWords.filter((word) => word.trim().length > 0 && haystack.includes(word.toLowerCase()));
};
