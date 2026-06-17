import type { ServerEnv } from '@/config/env';
import type { GenerationTask } from '@/ai/ports';

export type Provider = 'anthropic' | 'openai' | 'google';

export interface ModelChoice {
  readonly provider: Provider;
  readonly model: string;
}

/** Tareas de solo texto (todas menos `image`). */
export type TextTask = Exclude<GenerationTask, 'image'>;

/**
 * Provider router config-driven.
 *
 * MODO ARRANQUE: solo tenemos llave de Gemini, asi que TODAS las tareas
 * (texto e imagen) se enrutan a Google. El soporte de Claude y OpenAI sigue
 * definido (en el adapter `vercel-ai-sdk.ts` y, para Claude, en
 * `inactiveClaudeRoute` mas abajo); reactivarlos = devolver su ruta aqui
 * cuando existan las llaves, sin tocar el dominio ni el adapter.
 */
export const routeModel = (task: GenerationTask, env: ServerEnv): ModelChoice => {
  switch (task) {
    case 'image':
      // Imagenes: modelo de imagen de Gemini.
      return { provider: 'google', model: env.GEMINI_MODEL_IMAGE };
    case 'copy':
    case 'script':
    case 'dynamic':
    case 'proposal':
      return { provider: 'google', model: env.GEMINI_MODEL_TEXT };
  }
};

/**
 * Ruteo Claude DEFINIDO pero INACTIVO (solo tareas de texto). Conserva el mapeo
 * de coste/calidad por tarea para volver a Claude cuando haya llave: bastaria
 * con delegar en esta funcion desde `routeModel`.
 */
export const inactiveClaudeRoute = (task: TextTask, env: ServerEnv): ModelChoice => {
  switch (task) {
    case 'proposal':
      return { provider: 'anthropic', model: env.AI_MODEL_HIGH };
    case 'script':
    case 'dynamic':
      return { provider: 'anthropic', model: env.AI_MODEL_BALANCED };
    case 'copy':
      return { provider: 'anthropic', model: env.AI_MODEL_FAST };
  }
};
