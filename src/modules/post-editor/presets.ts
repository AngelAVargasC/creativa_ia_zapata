import type { Background, BoxLayer, Design, Format, ImageLayer, Layer, TextLayer } from './types';

let counter = 0;
export const makeId = (prefix = 'l'): string => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

const NARANJA = '#ff6a00';

export const newTextLayer = (partial: Partial<TextLayer> = {}): TextLayer => ({
  id: makeId('t'),
  type: 'text',
  name: 'Texto',
  x: 80,
  y: 80,
  w: 640,
  h: 160,
  rotation: 0,
  opacity: 1,
  text: 'Texto',
  fontFamily: '"Arial Narrow", "Oswald", Impact, sans-serif',
  fontSize: 96,
  fontWeight: 800,
  italic: true,
  underline: false,
  uppercase: true,
  align: 'left',
  color: '#ffffff',
  lineHeight: 1,
  letterSpacing: 0,
  bg: null,
  padX: 24,
  padY: 16,
  radius: 0,
  ...partial,
});

export const newBoxLayer = (partial: Partial<BoxLayer> = {}): BoxLayer => ({
  id: makeId('b'),
  type: 'box',
  name: 'Forma',
  x: 100,
  y: 100,
  w: 360,
  h: 160,
  rotation: 0,
  opacity: 1,
  fill: NARANJA,
  radius: 0,
  borderColor: null,
  borderWidth: 0,
  ...partial,
});

/** Logos oficiales Go On (en public/media). */
export const LOGOS = {
  blanco: '/media/FONDOFOOTERGOONnobg.webp', // para fondos oscuros
  color: '/media/logo-goon-bg-white.webp', // para fondos claros
} as const;

const LOGO_RATIO = 0.5; // alto/ancho aproximado del lockup

/** Capa de logo Go On (ajuste "contener" para no recortar). */
export const newLogoLayer = (src: string, format: Format, widthFrac = 0.26): ImageLayer => {
  const w = Math.round(format.w * widthFrac);
  const h = Math.round(w * LOGO_RATIO);
  return {
    id: makeId('logo'),
    type: 'image',
    name: 'Logo Go On',
    x: Math.round(format.w * 0.06),
    y: Math.round(format.h - h - format.h * 0.05),
    w,
    h,
    rotation: 0,
    opacity: 1,
    src,
    radius: 0,
    flipH: false,
    flipV: false,
    fit: 'contain',
    isLogo: true,
  };
};

export const newImageLayer = (src: string, format: Format, natural?: { w: number; h: number }): ImageLayer => {
  // Encaja la imagen al ancho del artboard manteniendo proporción.
  const ratio = natural && natural.w > 0 ? natural.h / natural.w : 0.66;
  const w = format.w;
  const h = Math.round(w * ratio);
  return {
    id: makeId('img'),
    type: 'image',
    name: 'Foto del auto',
    x: 0,
    y: Math.round((format.h - h) / 2),
    w,
    h,
    rotation: 0,
    opacity: 1,
    src,
    radius: 0,
    flipH: false,
    flipV: false,
    fit: 'cover',
  };
};

const BG_TRANSFORM = { scale: 1, offsetX: 0, offsetY: 0, blur: 0, dim: 0 };

const solidBg = (color: string): Background => ({
  kind: 'solid',
  color,
  gradient: '',
  gradientFrom: '#000',
  gradientTo: '#000',
  gradientAngle: 90,
  src: null,
  ...BG_TRANSFORM,
});

/** Plantilla Go On inicial (editable): fondo negro + título + tagline + marca. */
export const defaultDesign = (
  format: Format,
  seed: { modelo?: string; tagline?: string } = {},
): Design => {
  const layers: Layer[] = [
    newTextLayer({
      name: 'Modelo',
      text: seed.modelo || 'MODELO',
      x: format.w * 0.06,
      y: format.h * 0.07,
      w: format.w * 0.86,
      h: format.h * 0.13,
      fontSize: Math.round(format.w * 0.095),
    }),
    newTextLayer({
      name: 'Tagline',
      text: seed.tagline || 'AÑO / VERSIÓN',
      x: format.w * 0.06,
      y: format.h * 0.2,
      w: format.w * 0.5,
      h: format.h * 0.1,
      fontSize: Math.round(format.w * 0.072),
      bg: NARANJA,
      padX: 26,
      padY: 10,
    }),
    newLogoLayer(LOGOS.blanco, format),
  ];
  return { format, background: solidBg('#000000'), layers };
};

/** Fondos procedurales (sin IA): instantáneos y siempre disponibles. */
export const BG_PRESETS: readonly { readonly label: string; readonly bg: () => Background }[] = [
  { label: 'Estudio negro', bg: () => solidBg('#000000') },
  {
    label: 'Estudio degradado',
    bg: () => ({ kind: 'gradient', color: '#000', gradient: '', gradientFrom: '#1a1a1a', gradientTo: '#000000', gradientAngle: 120, src: null, ...BG_TRANSFORM }),
  },
  {
    label: 'Naranja premium',
    bg: () => ({ kind: 'gradient', color: '#000', gradient: '', gradientFrom: '#2a0f00', gradientTo: '#000000', gradientAngle: 135, src: null, ...BG_TRANSFORM }),
  },
  {
    label: 'Spotlight',
    bg: () => ({ kind: 'gradient', color: '#000', gradient: '', gradientFrom: '#3a3a3a', gradientTo: '#050505', gradientAngle: 90, src: null, ...BG_TRANSFORM }),
  },
  { label: 'Blanco', bg: () => solidBg('#ffffff') },
];

/** Prompts de fondo orientados a autos (sin el auto, se compone aparte). */
export const AI_BG_PROMPTS: readonly { readonly label: string; readonly prompt: string }[] = [
  {
    label: 'Estudio cinematográfico',
    prompt:
      'Fondo de estudio fotográfico profesional para automóvil, negro con degradado sutil, piso pulido reflejante, iluminación cinematográfica lateral, sin ningún auto, alta gama, 8k',
  },
  {
    label: 'Showroom de lujo',
    prompt:
      'Showroom moderno de autos de lujo, piso reflejante, iluminación cálida, ventanales, bokeh suave, ambiente premium, sin ningún auto en la escena',
  },
  {
    label: 'Carretera al atardecer',
    prompt:
      'Carretera abierta al atardecer, cielo dramático naranja y morado, asfalto ligeramente mojado con reflejos, escena para comercial de auto, sin ningún auto',
  },
  {
    label: 'Urbano nocturno neón',
    prompt:
      'Garaje industrial urbano de noche, luces neón naranjas y azules, humo ligero, piso de concreto reflejante, estética para foto de auto deportivo, sin ningún auto',
  },
  {
    label: 'Abstracto premium',
    prompt:
      'Fondo abstracto oscuro premium con destellos y líneas de luz naranjas, degradado profundo, elegante y minimalista para publicidad de auto, sin ningún auto',
  },
];
