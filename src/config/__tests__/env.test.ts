import { describe, it, expect } from 'vitest';
import { parseServerEnv } from '@/config/env';

// La unica llave requerida en modo arranque.
const base = { GOOGLE_GENERATIVE_AI_API_KEY: 'g-key' };

describe('parseServerEnv', () => {
  it('trata variables vacias ("") como ausentes (no rompe el arranque)', () => {
    const env = parseServerEnv({
      ...base,
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      R2_ACCOUNT_ID: '',
      R2_PUBLIC_BASE_URL: '',
      NEXT_PUBLIC_SUPABASE_URL: '   ',
    });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.R2_ACCOUNT_ID).toBeUndefined();
    expect(env.R2_PUBLIC_BASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it('aplica los defaults de modelos cuando faltan o estan vacios', () => {
    const env = parseServerEnv({ ...base, GEMINI_MODEL_TEXT: '', AI_MODEL_HIGH: undefined });
    expect(env.GEMINI_MODEL_TEXT).toBe('gemini-2.5-flash');
    expect(env.GEMINI_MODEL_IMAGE).toBe('imagen-3.0-generate-002');
    expect(env.AI_MODEL_HIGH).toBe('claude-opus-4-8');
  });

  it('falla rapido si falta la llave activa (Google)', () => {
    expect(() => parseServerEnv({ GOOGLE_GENERATIVE_AI_API_KEY: '' })).toThrow(/GOOGLE_GENERATIVE_AI_API_KEY/);
  });

  it('rechaza una URL invalida si se proporciona', () => {
    expect(() => parseServerEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: 'no-es-url' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it('acepta valores validos sin tocarlos', () => {
    const env = parseServerEnv({
      ...base,
      ANTHROPIC_API_KEY: 'sk-ant',
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    });
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co');
  });
});
