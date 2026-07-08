'use client';

import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import type { AppRole } from '@/core/tenant';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { logout } from '@/app/login/actions';
import {
  BuildingIcon,
  ChevronLeftIcon,
  ClipboardIcon,
  DeckIcon,
  HomeIcon,
  ImageIcon,
  LibraryIcon,
  LogoutIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
} from './icons';
import styles from './shell.module.css';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: ReactNode;
}
interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  solicitante: 'Agencia',
};

/** Navegacion segun rol: la agencia solo ve sus solicitudes; el staff gestiona. */
const navFor = (role: AppRole): readonly NavGroup[] => {
  const inicio: NavGroup = {
    label: '',
    items: [{ label: 'Inicio', href: '/inicio', icon: <HomeIcon /> }],
  };

  if (role === 'solicitante') {
    return [
      inicio,
      {
        label: 'Solicitudes',
        items: [
          { label: 'Mis solicitudes', href: '/solicitudes', icon: <ClipboardIcon /> },
          { label: 'Nueva solicitud', href: '/solicitudes/nueva', icon: <PlusIcon /> },
        ],
      },
    ];
  }

  const groups: NavGroup[] = [
    inicio,
    {
      label: 'Operación',
      items: [{ label: 'Solicitudes', href: '/solicitudes', icon: <ClipboardIcon /> }],
    },
    {
      label: 'Crear',
      items: [
        { label: 'Estudio de post', href: '/estudio', icon: <ImageIcon /> },
        { label: 'Generar contenido', href: '/generar', icon: <SparklesIcon /> },
        { label: 'Propuestas', href: '/propuestas', icon: <DeckIcon /> },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { label: 'Biblioteca', href: '/biblioteca', icon: <LibraryIcon /> },
        { label: 'Agencias y marcas', href: '/agencias', icon: <BuildingIcon /> },
      ],
    },
  ];

  if (role === 'admin') {
    groups.push({
      label: 'Administración',
      items: [{ label: 'Operadores', href: '/admin/operadores', icon: <UsersIcon /> }],
    });
  }

  return groups;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
};
const itemVariant: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } },
};

const initials = (email?: string): string => (email ? email.slice(0, 2).toUpperCase() : '··');

interface SidebarProps {
  readonly user: { readonly email?: string; readonly role: AppRole; readonly tenantId?: string };
  readonly collapsed: boolean;
  readonly mobileOpen: boolean;
  readonly onToggleCollapse: () => void;
}

export const Sidebar = ({ user, collapsed, mobileOpen, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const nav = navFor(user.role);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} data-open={mobileOpen}>
      <div className={styles.sidebarHeader}>
        <Link href={'/generar' as Route} className={styles.logo} aria-label="Creatiba Studio — inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/creatiba-studio-wordmark.png" alt="Creatiba Studio" className={styles.logoImg} />
        </Link>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronLeftIcon />
        </button>
      </div>

      <motion.nav className={styles.nav} variants={container} initial="hidden" animate="show">
        {nav.map((group) => (
          <div className={styles.navGroup} key={group.label || 'inicio'}>
            {group.label && <p className={styles.navGroupLabel}>{group.label}</p>}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <motion.div key={item.href} variants={itemVariant}>
                  <Link
                    href={item.href as Route}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    title={item.label}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.footerTop}>
          <div className={styles.user}>
            <span className={styles.userAvatar} aria-hidden="true">
              {initials(user.email)}
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userEmail}>{user.email ?? 'Sesión activa'}</span>
              <span className={styles.userTenant}>{ROLE_LABEL[user.role]}</span>
            </span>
          </div>
          <ThemeToggle />
        </div>
        <form action={logout}>
          <button className={`btn btn-ghost ${styles.logoutBtn}`} type="submit">
            <LogoutIcon />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </form>
      </div>
    </aside>
  );
};
