'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, BellIcon, MenuIcon } from './icons';
import type { Route } from 'next';
import styles from './shell.module.css';

interface TopbarProps {
  readonly onOpenMenu: () => void;
}

/** Barra superior del contenido: buscador global + notificaciones. */
export const Topbar = ({ onOpenMenu }: TopbarProps) => {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push((term ? `/solicitudes?q=${encodeURIComponent(term)}` : '/solicitudes') as Route);
  };

  return (
    <div className={styles.topbar}>
      <button
        type="button"
        className={`icon-btn ${styles.topbarMenu}`}
        onClick={onOpenMenu}
        aria-label="Abrir menú"
      >
        <MenuIcon />
      </button>

      <form className={styles.search} onSubmit={submit} role="search">
        <span className={styles.searchIcon} aria-hidden="true">
          <SearchIcon size={17} />
        </span>
        <input
          className={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar solicitudes, agencias, tipos de contenido…"
          aria-label="Buscar"
          type="search"
        />
        <kbd className={styles.searchKbd} aria-hidden="true">
          ↵
        </kbd>
      </form>

      <div className={styles.topbarActions}>
        <div className={styles.notifWrap}>
          <button
            type="button"
            className={`icon-btn ${styles.notifBtn}`}
            aria-label="Notificaciones"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((o) => !o)}
          >
            <BellIcon size={18} />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className={styles.notifScrim} onClick={() => setNotifOpen(false)} aria-hidden="true" />
                <motion.div
                  className={styles.notifPanel}
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <div className={styles.notifHead}>Notificaciones</div>
                  <div className={styles.notifEmpty}>
                    <span className={styles.notifEmptyIcon} aria-hidden="true">
                      <BellIcon size={22} />
                    </span>
                    <p className={styles.notifEmptyTitle}>Estás al día</p>
                    <span className={styles.notifEmptyDesc}>
                      Aquí verás los avances de estatus y los links finales de tus solicitudes.
                    </span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
