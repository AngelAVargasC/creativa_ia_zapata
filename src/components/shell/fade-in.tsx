'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly y?: number;
  readonly className?: string;
}

/** Entrada suave (opacidad + leve desplazamiento). Para aparicion fluida de elementos. */
export const FadeIn = ({ children, delay = 0, y = 10, className }: FadeInProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1], delay }}
  >
    {children}
  </motion.div>
);
