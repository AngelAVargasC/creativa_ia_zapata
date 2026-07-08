'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@/components/shell/icons';
import { login } from './actions';
import { SubmitButton } from './submit-button';
import styles from './login.module.css';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] } },
};

/** Formulario de login con iconos por campo, ver/ocultar contraseña y entrada escalonada. */
export const LoginForm = () => {
  const [showPw, setShowPw] = useState(false);

  return (
    <motion.form action={login} className={styles.form} variants={container} initial="hidden" animate="show">
      <motion.label className="field" variants={item}>
        <span className="field-label">Email</span>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon} aria-hidden="true">
            <MailIcon size={17} />
          </span>
          <input
            className={`input ${styles.iconInput}`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@agencia.com"
            required
          />
        </div>
      </motion.label>

      <motion.label className="field" variants={item}>
        <span className="field-label">Contraseña</span>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon} aria-hidden="true">
            <LockIcon size={17} />
          </span>
          <input
            className={`input ${styles.iconInput} ${styles.pwInput}`}
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={8}
          />
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPw}
          >
            <motion.span
              key={showPw ? 'off' : 'on'}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex' }}
            >
              {showPw ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
            </motion.span>
          </button>
        </div>
      </motion.label>

      <motion.div variants={item}>
        <SubmitButton />
      </motion.div>
    </motion.form>
  );
};
