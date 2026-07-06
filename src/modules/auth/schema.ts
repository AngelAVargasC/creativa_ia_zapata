import { z } from 'zod';

/** Validacion del borde de login. Email/contrasena para empezar. */
export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type Credentials = z.infer<typeof credentialsSchema>;
