'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { AppRole } from '@/core/tenant';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import styles from './shell.module.css';

interface AppShellProps {
  readonly user: { readonly email?: string; readonly role: AppRole; readonly tenantId?: string };
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
        <Topbar onOpenMenu={() => setMobileOpen(true)} />

        <motion.main
          key={pathname}
          className={styles.content}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};
