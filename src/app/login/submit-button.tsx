'use client';

import { useFormStatus } from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@/components/shell/icons';
import styles from './login.module.css';

interface SubmitButtonProps {
  readonly idleLabel?: string;
  readonly pendingLabel?: string;
}

/** Boton de envio con estado de carga animado (usa el pending del form action). */
export const SubmitButton = ({ idleLabel = 'Entrar', pendingLabel = 'Entrando…' }: SubmitButtonProps) => {
  const { pending } = useFormStatus();
  return (
    <button className={`btn btn-primary ${styles.submit}`} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <motion.span
            className={styles.spinner}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 0.7 }}
          />
          {pendingLabel}
        </>
      ) : (
        <>
          {idleLabel}
          <ArrowRightIcon size={17} />
        </>
      )}
    </button>
  );
};
