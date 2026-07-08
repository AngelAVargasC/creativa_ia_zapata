/**
 * Modelo de un editor de diseño por capas (estilo Figma) para los posts.
 * El "artboard" tiene un tamaño lógico (px) segun el formato; cada capa se
 * posiciona en esas coordenadas. La UI escala el artboard a la pantalla y el
 * exportador dibuja las capas a un canvas del tamaño real -> PNG nítido.
 */

export type LayerType = 'image' | 'text' | 'box';

export interface BaseLayer {
  readonly id: string;
  readonly type: LayerType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // grados
  opacity: number; // 0..1
  locked?: boolean;
  hidden?: boolean;
}

export interface ImageLayer extends BaseLayer {
  readonly type: 'image';
  src: string; // dataURL u URL
  radius: number; // border-radius px
  flipH: boolean;
  flipV: boolean;
  fit: 'cover' | 'contain';
  isLogo?: boolean; // el logo NO se retoca con IA (queda nítido)
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextLayer extends BaseLayer {
  readonly type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  align: TextAlign;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  bg: string | null; // color de caja detrás del texto (null = sin caja)
  padX: number;
  padY: number;
  radius: number;
}

export interface BoxLayer extends BaseLayer {
  readonly type: 'box';
  fill: string;
  radius: number;
  borderColor: string | null;
  borderWidth: number;
}

export type Layer = ImageLayer | TextLayer | BoxLayer;

export type BackgroundKind = 'solid' | 'gradient' | 'image';

export interface Background {
  kind: BackgroundKind;
  color: string; // solid
  gradient: string; // css gradient (para preview) / se replica en canvas
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  src: string | null; // image (IA o subida)
  // Acomodo del fondo imagen (para casar mejor con el auto):
  scale: number; // 1 = cover base; >1 acerca
  offsetX: number; // px sobre el artboard
  offsetY: number;
  blur: number; // px de desenfoque
  dim: number; // 0..1 capa oscura encima (homogeneiza)
}

export interface Format {
  readonly id: string;
  readonly label: string;
  readonly w: number;
  readonly h: number;
}

export const FORMATS: readonly Format[] = [
  { id: '1:1', label: 'Cuadrado 1:1', w: 1080, h: 1080 },
  { id: '4:5', label: 'Vertical 4:5', w: 1080, h: 1350 },
  { id: '9:16', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: '16:9', label: 'Horizontal 16:9', w: 1920, h: 1080 },
  { id: '4:3', label: 'Clásico 4:3', w: 1440, h: 1080 },
];

export interface Design {
  format: Format;
  background: Background;
  layers: Layer[];
}

/** Fuentes disponibles (system/web-safe, sin CDN). */
export const FONT_OPTIONS: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Condensada (Arial Narrow)', value: '"Arial Narrow", "Oswald", Impact, sans-serif' },
  { label: 'Impacto', value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
  { label: 'Sans (Inter/System)', value: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' },
  { label: 'Sans redonda (Arial)', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, "Courier New", monospace' },
];

/** Paleta de marca Go On para pickers rápidos. */
export const BRAND_SWATCHES: readonly string[] = [
  '#ff6a00',
  '#ffffff',
  '#000000',
  '#111111',
  '#e5322b',
  '#1a1a1a',
  '#f5f1ea',
];
