import { z } from 'zod';

/**
 * Registro abierto de agencias. Dos modos: elegir una sucursal del catalogo
 * (existing) o dar de alta una nueva que no aparezca (new). En ambos casos se
 * crea 1 usuario solicitante ligado 1:1 a la agencia.
 */
export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    mode: z.enum(['existing', 'new']),
    agencyId: z.string().uuid().optional(),
    nombre: z.string().trim().min(2, 'Nombre de agencia muy corto').max(120).optional(),
    address: z.string().trim().max(300).optional(),
  })
  .refine((d) => (d.mode === 'existing' ? Boolean(d.agencyId) : Boolean(d.nombre)), {
    message: 'Selecciona una agencia del listado o crea una nueva',
    path: ['agencyId'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
