/** Iconos de linea (stroke) estilo Linear. 18px, currentColor, trazo fino. */
type IconProps = { readonly size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const SparklesIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    <path d="M19 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
  </svg>
);

export const DeckIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const LibraryIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 5v14M8 5v14" />
    <rect x="11.5" y="4.5" width="3.6" height="15" rx="1" transform="rotate(-8 13 12)" />
    <path d="M18.5 6l3 12.5" />
  </svg>
);

export const BuildingIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="4" y="3" width="11" height="18" rx="1.5" />
    <path d="M15 9h4a1 1 0 0 1 1 1v11M8 7h3M8 11h3M8 15h3" />
  </svg>
);

export const MenuIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M14 6l-6 6 6 6" />
  </svg>
);

export const LogoutIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12H3M6 8l-4 4 4 4" />
  </svg>
);

export const PlusIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Marca / logo (cuadro con destello). */
export const LogoMark = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--accent)" />
    <path d="M12 6.5l1.4 3.6 3.6 1.4-3.6 1.4L12 16.5l-1.4-3.6L7 11.5l3.6-1.4L12 6.5Z" fill="var(--accent-contrast)" />
  </svg>
);
