'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { LogoMark, MenuIcon } from './icons';
import styles from './shell.module.css';

interface AppShellProps {
  readonly user: { readonly email?: string; readonly tenantId: string };
  readonly children: ReactNode;
}

/**
 * App shell persistente: sidebar colapsable + area de contenido con scroll
 * interno (la ventana no scrollea, asi las transiciones de pagina no provocan
 * un scrollbar en el documento). El crossfade es opacidad pura (sin transform),
 * y la aparicion de elementos la resuelve cada pagina con FadeIn.
 */
export const AppShell = ({ user, children }: AppShellProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const shellStyle = { '--sidebar-w': collapsed ? '72px' : '244px' } as CSSProperties;

  return (
    <div className={styles.shell} style={shellStyle}>
      <Sidebar
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      {mobileOpen && <div className={styles.scrim} onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <div className={styles.main}>
        <div className={styles.mobileBar}>
          <button type="button" className="icon-btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <MenuIcon />
          </button>
          <span className={styles.mobileBrand}>
            <LogoMark size={20} />
            Creatiba
          </span>
        </div>

        <motion.main
          key={pathname}
          className={styles.content}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};
