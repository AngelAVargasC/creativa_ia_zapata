import { describe, it, expect } from 'vitest';
import type { ServerEnv } from '@/config/env';
import type { GenerationTask } from '@/ai/ports';
import { routeModel, inactiveClaudeRoute } from '@/ai/models';

// Env minimo y tipado (sin tocar process.env): solo lo que el router lee.
const env = {
  NODE_ENV: 'test',
  GOOGLE_GENERATIVE_AI_API_KEY: 'k',
  GEMINI_MODEL_TEXT: 'gemini-2.5-flash',
  GEMINI_MODEL_IMAGE: 'imagen-3.0-generate-002',
  AI_MODEL_HIGH: 'claude-opus-4-8',
  AI_MODEL_BALANCED: 'claude-sonnet-4-6',
  AI_MODEL_FAST: 'claude-haiku-4-5',
} satisfies ServerEnv;

describe('routeModel (modo arranque: solo Gemini)', () => {
  const textTasks: readonly GenerationTask[] = ['copy', 'script', 'proposal', 'dynamic'];

  it('enruta todas las tareas de texto a Gemini', () => {
    for (const task of textTasks) {
      const choice = routeModel(task, env);
      expect(choice.provider).toBe('google');
      expect(choice.model).toBe('gemini-2.5-flash');
    }
  });

  it('enruta imagen al modelo de imagen de Gemini', () => {
    const choice = routeModel('image', env);
    expect(choice).toEqual({ provider: 'google', model: 'imagen-3.0-generate-002' });
  });
});

describe('inactiveClaudeRoute (definido pero inactivo)', () => {
  it('mantiene el mapeo coste/calidad a Anthropic para reactivar', () => {
    expect(inactiveClaudeRoute('proposal', env)).toEqual({ provider: 'anthropic', model: 'claude-opus-4-8' });
    expect(inactiveClaudeRoute('script', env)).toEqual({ provider: 'anthropic', model: 'claude-sonnet-4-6' });
    expect(inactiveClaudeRoute('copy', env)).toEqual({ provider: 'anthropic', model: 'claude-haiku-4-5' });
  });
});
