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

export const HomeIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 11.4 12 4l8 7.4" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const BellIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.8 5.6 2 5.9H4c.2-.3 2-1.4 2-5.9Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
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

export const ImageIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 15l5-4 4 3 3-2 6 5" />
    <circle cx="8.5" cy="9" r="1.4" />
  </svg>
);

export const ClipboardIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V4ZM9 11h6M9 15h4" />
  </svg>
);

export const UsersIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.5M17 20a5.5 5.5 0 0 0-2.5-4.6" />
  </svg>
);

export const MailIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const LockIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const EyeIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a15.4 15.4 0 0 1-3 3.4M6.5 7.6A15 15 0 0 0 2.5 12S6 18 12 18a9.4 9.4 0 0 0 3.4-.6" />
    <path d="m4 4 16 16M10 10a3 3 0 0 0 4 4" />
  </svg>
);

export const ArrowRightIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const ClockIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const CheckIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
);

export const AlertTriangleIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 4 22 19H2L12 4Z" />
    <path d="M12 10v4M12 17.2v.1" />
  </svg>
);

export const TypeIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7V5h16v2M12 5v14M9 19h6" />
  </svg>
);

export const SquareIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
  </svg>
);

export const CircleIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ExpandIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const SaveIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 4h11l3 3v13H5z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </svg>
);

export const CopyIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

export const ArrowUpIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const ArrowDownIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const TrashIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
  </svg>
);

export const AlignLeftIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
  </svg>
);

export const AlignCenterIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
  </svg>
);

export const AlignRightIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />
  </svg>
);

export const FlipHorizontalIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3v18M9 7 5 12l4 5M15 7l4 5-4 5" />
  </svg>
);

export const FlipVerticalIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3 12h18M7 9l5-4 5 4M7 15l5 4 5-4" />
  </svg>
);

/** Marca / logo (cuadro con destello). */
export const LogoMark = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--accent)" />
    <path d="M12 6.5l1.4 3.6 3.6 1.4-3.6 1.4L12 16.5l-1.4-3.6L7 11.5l3.6-1.4L12 6.5Z" fill="var(--accent-contrast)" />
  </svg>
);
