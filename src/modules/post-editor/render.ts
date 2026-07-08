import type { Design, ImageLayer, Layer, TextLayer } from './types';

/** Carga una imagen (dataURL/URL) como HTMLImageElement. */
const loadOnce = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    // El preview carga las imágenes SIN CORS (CSS/img normales) y quedan
    // cacheadas sin cabeceras CORS. Para exportar al canvas necesitamos una
    // petición CORS fresca: un parámetro único evita reutilizar esa copia.
    const isRemote = src.startsWith('http');
    img.src = isRemote ? `${src}${src.includes('?') ? '&' : '?'}cors=${Date.now()}-${Math.random().toString(36).slice(2)}` : src;
  });

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Carga una imagen para el canvas (CORS), con reintentos ante 503 transitorios de R2. */
export const loadImage = async (src: string): Promise<HTMLImageElement> => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await loadOnce(src);
    } catch (e) {
      lastErr = e;
      await wait(400 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('No se pudo cargar la imagen');
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

/** Divide el texto en líneas respetando saltos manuales y ancho máximo. */
const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    const words = raw.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
};

const fontString = (t: TextLayer): string =>
  `${t.italic ? 'italic ' : ''}${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`;

const drawText = (ctx: CanvasRenderingContext2D, t: TextLayer) => {
  const value = t.uppercase ? t.text.toUpperCase() : t.text;
  ctx.font = fontString(t);
  ctx.textBaseline = 'top';
  // letterSpacing es soportado en navegadores modernos.
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t.letterSpacing}px`;
  } catch {
    /* noop */
  }

  // Caja de fondo (opcional)
  if (t.bg) {
    ctx.fillStyle = t.bg;
    roundRect(ctx, 0, 0, t.w, t.h, t.radius);
    ctx.fill();
  }

  const innerW = t.w - t.padX * 2;
  const lines = wrapLines(ctx, value, innerW);
  const lh = t.fontSize * t.lineHeight;
  ctx.fillStyle = t.color;
  ctx.textAlign = t.align;

  const ax = t.align === 'left' ? t.padX : t.align === 'right' ? t.w - t.padX : t.w / 2;
  lines.forEach((ln, i) => {
    const y = t.padY + i * lh;
    ctx.fillText(ln, ax, y);
    if (t.underline) {
      const w = ctx.measureText(ln).width;
      const ux = t.align === 'left' ? t.padX : t.align === 'right' ? t.w - t.padX - w : t.w / 2 - w / 2;
      ctx.fillRect(ux, y + t.fontSize * 1.02, w, Math.max(1, t.fontSize * 0.06));
    }
  });

  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
  } catch {
    /* noop */
  }
};

/** Dibuja una capa ya transformada al origen (0,0) de su caja. */
const drawLayerBody = (ctx: CanvasRenderingContext2D, layer: Layer, imgs: Map<string, HTMLImageElement>) => {
  if (layer.type === 'box') {
    ctx.fillStyle = layer.fill;
    roundRect(ctx, 0, 0, layer.w, layer.h, layer.radius);
    ctx.fill();
    if (layer.borderColor && layer.borderWidth > 0) {
      ctx.lineWidth = layer.borderWidth;
      ctx.strokeStyle = layer.borderColor;
      ctx.stroke();
    }
  } else if (layer.type === 'image') {
    const img = imgs.get(layer.id);
    if (!img) return;
    ctx.save();
    roundRect(ctx, 0, 0, layer.w, layer.h, layer.radius);
    ctx.clip();
    // Flip alrededor del centro
    ctx.translate(layer.w / 2, layer.h / 2);
    ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
    ctx.translate(-layer.w / 2, -layer.h / 2);
    const scale =
      layer.fit === 'cover'
        ? Math.max(layer.w / img.naturalWidth, layer.h / img.naturalHeight)
        : Math.min(layer.w / img.naturalWidth, layer.h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (layer.w - dw) / 2, (layer.h - dh) / 2, dw, dh);
    ctx.restore();
  } else {
    drawText(ctx, layer);
  }
};

/** Dibuja todo el diseño en el contexto (asume canvas del tamaño del formato). */
export const drawDesign = (
  ctx: CanvasRenderingContext2D,
  design: Design,
  imgs: Map<string, HTMLImageElement>,
  bgImg: HTMLImageElement | null,
) => {
  const { w, h } = design.format;
  const bg = design.background;

  // Fondo
  if (bg.kind === 'image' && bgImg) {
    ctx.save();
    if (bg.blur > 0) ctx.filter = `blur(${bg.blur}px)`;
    // cover a escala 1, luego escala del usuario + desplazamiento (centrados).
    const cover = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * cover;
    const dh = bgImg.naturalHeight * cover;
    ctx.translate(w / 2 + bg.offsetX, h / 2 + bg.offsetY);
    ctx.scale(bg.scale || 1, bg.scale || 1);
    ctx.drawImage(bgImg, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    if (bg.dim > 0) {
      ctx.fillStyle = `rgba(0,0,0,${bg.dim})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (bg.kind === 'gradient') {
    const rad = (bg.gradientAngle * Math.PI) / 180;
    const x = Math.cos(rad);
    const y = Math.sin(rad);
    const grad = ctx.createLinearGradient(w / 2 - (x * w) / 2, h / 2 - (y * h) / 2, w / 2 + (x * w) / 2, h / 2 + (y * h) / 2);
    grad.addColorStop(0, bg.gradientFrom);
    grad.addColorStop(1, bg.gradientTo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
  }

  // Capas
  for (const layer of design.layers) {
    if (layer.hidden) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-layer.w / 2, -layer.h / 2);
    drawLayerBody(ctx, layer, imgs);
    ctx.restore();
  }
};

/** Renderiza el diseño a un PNG (Blob) del tamaño real del formato. */
export const exportPng = async (design: Design): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = design.format.w;
  canvas.height = design.format.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas');

  const imgs = new Map<string, HTMLImageElement>();
  await Promise.all(
    design.layers
      .filter((l): l is Extract<Layer, { type: 'image' }> => l.type === 'image' && Boolean(l.src))
      .map(async (l) => {
        imgs.set(l.id, await loadImage(l.src));
      }),
  );
  let bgImg: HTMLImageElement | null = null;
  if (design.background.kind === 'image' && design.background.src) {
    bgImg = await loadImage(design.background.src);
  }

  drawDesign(ctx, design, imgs, bgImg);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export falló'))), 'image/png');
  });
};

/**
 * Aplana SOLO la capa fotográfica (fondo + imágenes que no son logo) a PNG
 * base64, sin texto/formas/logo. Es la entrada para el retoque con IA: así el
 * modelo homogeniza el auto con el fondo sin tocar el plantillado.
 */
export const exportPhotoBase64 = async (design: Design): Promise<string> => {
  const photoLayers = design.layers.filter((l): l is ImageLayer => l.type === 'image' && !l.isLogo);
  const filtered: Design = { ...design, layers: photoLayers };
  const canvas = document.createElement('canvas');
  canvas.width = design.format.w;
  canvas.height = design.format.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas');

  const imgs = new Map<string, HTMLImageElement>();
  await Promise.all(photoLayers.map(async (l) => imgs.set(l.id, await loadImage(l.src))));
  let bgImg: HTMLImageElement | null = null;
  if (design.background.kind === 'image' && design.background.src) {
    bgImg = await loadImage(design.background.src);
  }

  drawDesign(ctx, filtered, imgs, bgImg);
  return canvas.toDataURL('image/png').split(',')[1] ?? '';
};
