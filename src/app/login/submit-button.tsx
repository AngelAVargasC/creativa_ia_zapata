'use client';

import { useFormStatus } from 'react-dom';
import { motion } from 'framer-motion';
import styles from './login.module.css';

/** Boton de envio con estado de carga animado (usa el pending del form action). */
export const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      className="btn btn-primary"
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{ width: '100%', height: 40 }}
    >
      {pending ? (
        <>
          <motion.span
            className={styles.spinner}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 0.7 }}
          />
          Entrando…
        </>
      ) : (
        'Entrar'
      )}
    </button>
  );
};
