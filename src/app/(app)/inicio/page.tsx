import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { listSolicitudes } from '@/modules/solicitudes/repository';
import { listPosts } from '@/modules/posts/repository';
import { formatDate } from '@/modules/solicitudes/format';
import type { SolicitudStatus } from '@/modules/solicitudes/schema';
import { FadeIn } from '@/components/shell/fade-in';
import { StatusBadge } from '@/components/solicitudes/status-badge';
import {
  ArrowRightIcon,
  ClipboardIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckIcon,
  SparklesIcon,
  ImageIcon,
  LibraryIcon,
  PlusIcon,
} from '@/components/shell/icons';
import styles from './home.module.css';

interface QuickAction {
  readonly href: string;
  readonly title: string;
  readonly desc: string;
  readonly icon: ReactNode;
}

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const nameFrom = (email?: string): string => {
  const raw = email?.split('@')[0] ?? '';
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'de nuevo';
};

const staffActions: readonly QuickAction[] = [
  { href: '/solicitudes', title: 'Solicitudes', desc: 'Gestiona y actualiza estatus', icon: <ClipboardIcon /> },
  { href: '/generar', title: 'Generar contenido', desc: 'Copies y guiones con IA', icon: <SparklesIcon /> },
  { href: '/estudio', title: 'Estudio de post', desc: 'Diseña el arte del post', icon: <ImageIcon /> },
  { href: '/biblioteca', title: 'Biblioteca', desc: 'Tus posts guardados', icon: <LibraryIcon /> },
];

const agencyActions: readonly QuickAction[] = [
  { href: '/solicitudes/nueva', title: 'Nueva solicitud', desc: 'Pide contenido al equipo', icon: <PlusIcon /> },
  { href: '/solicitudes', title: 'Mis solicitudes', desc: 'Sigue el estatus de cada una', icon: <ClipboardIcon /> },
];

const IN_PROGRESS: readonly SolicitudStatus[] = ['nueva', 'en_correccion', 'en_produccion', 'esperando_aprobacion', 'lista'];
const NEEDS_ATTENTION: readonly SolicitudStatus[] = ['en_correccion', 'esperando_aprobacion'];

const POST_STATUS: Record<string, { readonly label: string; readonly tone: string }> = {
  borrador: { label: 'Borrador', tone: 'muted' },
  listo: { label: 'Listo', tone: 'ok' },
  publicado: { label: 'Publicado', tone: 'info' },
};

export default async function HomePage() {
  const session = await resolveSession();
  const staff = session.ok && isStaffRole(session.value.role);
  const email = session.ok ? session.value.email : undefined;

  const res = await listSolicitudes();
  const list = res.ok ? res.value : [];
  const countBy = (statuses: readonly SolicitudStatus[]) =>
    list.filter((s) => statuses.includes(s.status)).length;

  const stats = [
    { icon: <ClipboardIcon size={19} />, value: list.length, label: staff ? 'Solicitudes totales' : 'Mis solicitudes' },
    { icon: <ClockIcon size={19} />, value: countBy(IN_PROGRESS), label: 'En curso' },
    { icon: <AlertTriangleIcon size={19} />, value: countBy(NEEDS_ATTENTION), label: 'Requieren atención' },
    { icon: <CheckIcon size={19} />, value: countBy(['publicada']), label: 'Publicadas' },
  ];

  const actions = staff ? staffActions : agencyActions;
  const recent = list.slice(0, 6);

  const postsRes = staff ? await listPosts() : null;
  const posts = postsRes && postsRes.ok ? postsRes.value.slice(0, 8) : [];

  return (
    <div className={styles.wrap}>
      <FadeIn y={6}>
        <div className={styles.hero}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/creatiba-studio-wordmark.png" alt="Creatiba Studio" className={styles.heroLogo} />
            <h1 className={styles.heroTitle}>
              {greeting()}, <span className={styles.heroName}>{nameFrom(email)}</span>.
            </h1>
            <p className={styles.heroSub}>
              {staff
                ? 'Este es tu centro de operación: revisa lo pendiente, crea contenido y lleva cada solicitud hasta su link final.'
                : 'Tu espacio para pedir contenido, pauta y feed — y seguir cada solicitud hasta el post final.'}
            </p>
          </div>
          <Link className="btn btn-primary" href={(staff ? '/solicitudes' : '/solicitudes/nueva') as Route}>
            {staff ? (
              <>
                <ClipboardIcon size={16} />
                Ver solicitudes
              </>
            ) : (
              <>
                <PlusIcon size={16} />
                Nueva solicitud
              </>
            )}
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={0.06} y={8}>
        <div className={styles.statGrid}>
          {stats.map((s) => (
            <div key={s.label} className={`card ${styles.statCard}`}>
              <div className={styles.statTop}>
                <span className={styles.statIcon}>{s.icon}</span>
              </div>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1} y={8}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
          </div>
          <div className={styles.actions}>
            {actions.map((a) => (
              <Link key={a.href} href={a.href as Route} className={`card card-interactive ${styles.actionCard}`}>
                <span className={styles.actionIcon}>{a.icon}</span>
                <span className={styles.actionText}>
                  <span className={styles.actionTitle}>{a.title}</span>
                  <span className={styles.actionDesc}>{a.desc}</span>
                </span>
                <span className={styles.actionArrow} aria-hidden="true">
                  <ArrowRightIcon size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className={`${styles.cols} ${staff ? '' : styles.colsSingle}`}>
        {staff && (
          <FadeIn delay={0.14} y={8} className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Últimos posts</h2>
              <Link className={styles.sectionLink} href={'/biblioteca' as Route}>
                Ver biblioteca
                <ArrowRightIcon size={15} />
              </Link>
            </div>
            {posts.length === 0 ? (
              <div className={`card ${styles.recentCard}`}>
                <p className={styles.recentEmpty}>Aún no hay posts guardados.</p>
              </div>
            ) : (
              <div className={styles.postGrid}>
                {posts.map((p) => {
                  const st = POST_STATUS[p.status] ?? { label: p.status, tone: 'muted' };
                  return (
                    <Link key={p.id} href={`/estudio/${p.id}` as Route} className={`card card-interactive ${styles.postCard}`}>
                      <span className={styles.postThumb}>
                        <span className={`badge ${styles.postBadge}`} data-tone={st.tone}>
                          {st.label}
                        </span>
                        <ImageIcon size={26} />
                      </span>
                      <span className={styles.postBody}>
                        <span className={styles.postTitle}>{p.title}</span>
                        <span className={styles.postMeta}>
                          {p.agencia_nombre ? `${p.agencia_nombre} · ` : ''}
                          {formatDate(p.updated_at)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </FadeIn>
        )}

        <FadeIn delay={0.18} y={8} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Actividad reciente</h2>
            <Link className={styles.sectionLink} href={'/solicitudes' as Route}>
              Ver todo
              <ArrowRightIcon size={15} />
            </Link>
          </div>
          <div className={`card ${styles.recentCard}`}>
            {recent.length === 0 ? (
              <p className={styles.recentEmpty}>Aún no hay solicitudes.</p>
            ) : (
              recent.map((s) => (
                <Link key={s.id} href={`/solicitudes/${s.id}` as Route} className={styles.recentItem}>
                  <span className={styles.recentMain}>
                    <span className={styles.recentTitle}>{staff ? s.agencia_nombre : s.tipo_contenido}</span>
                    <span className={styles.recentMeta}>
                      {staff ? `${s.tipo_contenido} · ` : ''}
                      {formatDate(s.updated_at)}
                    </span>
                  </span>
                  <span className={styles.recentRight}>
                    <StatusBadge status={s.status} />
                  </span>
                </Link>
              ))
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
