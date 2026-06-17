import { z } from 'zod';

/**
 * Validacion del borde (API). El tenant NO viaja aqui: se resuelve en servidor
 * desde la sesion. Solo se acepta la marca y el brief.
 */
export const generateCopyRequestSchema = z.object({
  brand: z.object({
    agencyName: z.string().min(1).max(120),
    voice: z.string().min(1).max(2000),
    bannedWords: z.array(z.string().max(120)).max(200).default([]),
  }),
  brief: z.object({
    platform: z.enum(['facebook', 'instagram']),
    objective: z.string().min(1).max(500),
    tone: z.enum(['cercano', 'profesional', 'divertido', 'inspirador']),
    product: z.string().min(1).max(200),
    maxChars: z.number().int().min(40).max(2200),
  }),
});

export type GenerateCopyRequest = z.infer<typeof generateCopyRequestSchema>;
