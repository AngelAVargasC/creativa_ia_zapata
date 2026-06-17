import { describe, it, expect } from 'vitest';
import { buildCopyPrompt, findBrandViolations, type BrandProfile, type CopyBrief } from '../domain/copy';

const brand: BrandProfile = {
  agencyName: 'Zapata Norte',
  voice: 'cercana, optimista y clara',
  bannedWords: ['barato', 'gratis'],
};

const brief: CopyBrief = {
  platform: 'instagram',
  objective: 'anunciar el lanzamiento de la nueva linea',
  tone: 'inspirador',
  product: 'cafetera premium',
  maxChars: 280,
};

describe('buildCopyPrompt', () => {
  it('incluye la marca, la voz y las palabras prohibidas en el system', () => {
    const { system } = buildCopyPrompt(brand, brief);
    expect(system).toContain('Zapata Norte');
    expect(system).toContain('cercana, optimista y clara');
    expect(system).toContain('barato');
    expect(system).toContain('gratis');
  });

  it('incluye plataforma, producto, objetivo, tono y limite en el prompt', () => {
    const { prompt } = buildCopyPrompt(brand, brief);
    expect(prompt).toContain('Instagram');
    expect(prompt).toContain('cafetera premium');
    expect(prompt).toContain('nueva linea');
    expect(prompt).toContain('inspirador');
    expect(prompt).toContain('280');
  });

  it('omite la instruccion de prohibidas si no hay palabras vetadas', () => {
    const { system } = buildCopyPrompt({ ...brand, bannedWords: [] }, brief);
    expect(system).not.toContain('Nunca uses estas palabras');
  });
});

describe('findBrandViolations', () => {
  it('detecta palabras prohibidas sin distinguir mayusculas', () => {
    expect(findBrandViolations(brand, 'Cafe casi GRATIS hoy')).toEqual(['gratis']);
  });

  it('devuelve vacio cuando el texto cumple', () => {
    expect(findBrandViolations(brand, 'Despierta tus sentidos con cada taza')).toEqual([]);
  });
});
