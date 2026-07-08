import { z } from 'zod';

export const postStatusSchema = z.enum(['borrador', 'listo', 'publicado']);
export type PostStatus = z.infer<typeof postStatusSchema>;

/** Guardado (upsert) de un post del estudio. `design` es el JSON del editor. */
export const savePostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Ponle un título').max(200).default('Post sin título'),
  tenantId: z.string().uuid().nullable().optional(),
  solicitudId: z.string().uuid().nullable().optional(),
  caption: z.string().max(5000).default(''),
  status: postStatusSchema.default('borrador'),
  design: z.unknown(),
});

export type SavePostInput = z.infer<typeof savePostSchema>;
