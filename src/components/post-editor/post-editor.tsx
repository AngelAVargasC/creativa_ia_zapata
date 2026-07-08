'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FORMATS,
  FONT_OPTIONS,
  BRAND_SWATCHES,
  type Design,
  type Format,
  type Layer,
} from '@/modules/post-editor/types';
import { defaultDesign, newTextLayer, newBoxLayer, newImageLayer, newLogoLayer, makeId, LOGOS, BG_PRESETS, AI_BG_PROMPTS } from '@/modules/post-editor/presets';
import { exportPng, exportPhotoBase64 } from '@/modules/post-editor/render';
import { CaptionPanel } from './caption-panel';
import { savePostAction } from '@/app/(app)/estudio/actions';
import {
  TypeIcon,
  SquareIcon,
  ImageIcon,
  CircleIcon,
  ExpandIcon,
  SaveIcon,
  CheckIcon,
  AlertTriangleIcon,
  CopyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  SparklesIcon,
} from '@/components/shell/icons';
import styles from './post-editor.module.css';

interface Props {
  readonly solicitudId?: string;
  readonly tenantId?: string | null;
  readonly info: string;
  readonly seedModelo: string;
  readonly postId?: string;
  readonly initialDesign?: Design;
  readonly initialTitle?: string;
  readonly initialCaption?: string;
}

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type HandleId = (typeof HANDLES)[number];

type Drag =
  | { kind: 'move'; id: string; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'resize'; id: string; handle: HandleId; sx: number; sy: number; box: { x: number; y: number; w: number; h: number } }
  | { kind: 'rotate'; id: string; cx: number; cy: number; startRot: number; startAngle: number };

export const PostEditor = ({
  solicitudId,
  tenantId,
  info,
  seedModelo,
  postId: initialPostId,
  initialDesign,
  initialTitle,
  initialCaption,
}: Props) => {
  const [design, setDesign] = useState<Design>(() => initialDesign ?? defaultDesign(FORMATS[0]!, { modelo: seedModelo }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<'diseno' | 'caption'>('diseno');

  // Persistencia
  const [postId, setPostId] = useState<string | undefined>(initialPostId);
  const [title, setTitle] = useState(initialTitle ?? 'Post sin título');
  const [caption, setCaption] = useState(initialCaption ?? '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const guardar = async () => {
    setSaveState('saving');
    setSaveError(null);
    const res = await savePostAction({
      id: postId,
      title,
      tenantId: tenantId ?? null,
      solicitudId: solicitudId ?? null,
      caption,
      status: 'borrador',
      design,
    });
    if (!res.ok) {
      setSaveState('error');
      setSaveError(res.error ?? 'No se pudo guardar.');
      return;
    }
    if (res.id) setPostId(res.id);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1800);
  };
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const [harmBusy, setHarmBusy] = useState(false);
  const [harmError, setHarmError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [scale, setScale] = useState(0.4);

  const selected = design.layers.find((l) => l.id === selectedId) ?? null;

  // Refs "vivos" para los atajos de teclado (evitan closures obsoletos).
  const designRef = useRef(design);
  designRef.current = design;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;
  const clipboardRef = useRef<Layer | null>(null);

  /** Clona una capa con id nuevo y ligero desplazamiento (para pegar/duplicar). */
  const pasteLayer = useCallback((layer: Layer) => {
    const clone = { ...layer, id: makeId(layer.type), x: layer.x + 24, y: layer.y + 24 } as Layer;
    setDesign((d) => ({ ...d, layers: [...d.layers, clone] }));
    setSelectedId(clone.id);
  }, []);

  // ── Escala del artboard al contenedor ──
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const pad = 48;
      const availW = el.clientWidth - pad;
      const availH = el.clientHeight - pad;
      setScale(Math.max(0.05, Math.min(availW / design.format.w, availH / design.format.h)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [design.format]);

  // ── Helpers de estado ──
  const update = useCallback((id: string, patch: Partial<Layer>) => {
    setDesign((d) => ({
      ...d,
      layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
    }));
  }, []);

  const addLayer = (layer: Layer) => {
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };

  const removeLayer = (id: string) => {
    setDesign((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
    setSelectedId(null);
  };

  const reorder = (id: string, dir: 'up' | 'down') => {
    setDesign((d) => {
      const i = d.layers.findIndex((l) => l.id === id);
      if (i < 0) return d;
      const j = dir === 'up' ? i + 1 : i - 1;
      if (j < 0 || j >= d.layers.length) return d;
      const layers = [...d.layers];
      [layers[i], layers[j]] = [layers[j]!, layers[i]!];
      return { ...d, layers };
    });
  };

  const setFormat = (f: Format) => setDesign((d) => ({ ...d, format: f }));

  /** Edita la capa por nombre (para enlazar los datos con las capas de la plantilla). */
  const updateLayerByName = useCallback((name: string, patch: Partial<Layer>) => {
    setDesign((d) => ({ ...d, layers: d.layers.map((l) => (l.name === name ? ({ ...l, ...patch } as Layer) : l)) }));
  }, []);
  const layerText = (name: string): string => {
    const l = design.layers.find((x) => x.name === name);
    return l && l.type === 'text' ? l.text : '';
  };

  // ── Interacción (mover / redimensionar / rotar) ──
  const onPointerDownLayer = (e: React.PointerEvent, id: string) => {
    if (editingId) return;
    e.stopPropagation();
    setSelectedId(id);
    const l = design.layers.find((x) => x.id === id);
    if (!l || l.locked) return;
    dragRef.current = { kind: 'move', id, sx: e.clientX, sy: e.clientY, ox: l.x, oy: l.y };
  };

  const onPointerDownHandle = (e: React.PointerEvent, handle: HandleId) => {
    e.stopPropagation();
    if (!selected) return;
    dragRef.current = {
      kind: 'resize',
      id: selected.id,
      handle,
      sx: e.clientX,
      sy: e.clientY,
      box: { x: selected.x, y: selected.y, w: selected.w, h: selected.h },
    };
  };

  const onPointerDownRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!selected || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    // centro del layer en coordenadas de pantalla
    const originX = rect.left + (rect.width - design.format.w * scale) / 2;
    const originY = rect.top + (rect.height - design.format.h * scale) / 2;
    const cx = originX + (selected.x + selected.w / 2) * scale;
    const cy = originY + (selected.y + selected.h / 2) * scale;
    dragRef.current = {
      kind: 'rotate',
      id: selected.id,
      cx,
      cy,
      startRot: selected.rotation,
      startAngle: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
    };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.kind === 'move') {
        const dx = (e.clientX - drag.sx) / scale;
        const dy = (e.clientY - drag.sy) / scale;
        update(drag.id, { x: Math.round(drag.ox + dx), y: Math.round(drag.oy + dy) });
      } else if (drag.kind === 'resize') {
        const dx = (e.clientX - drag.sx) / scale;
        const dy = (e.clientY - drag.sy) / scale;
        const b = drag.box;
        let { x, y, w, h } = b;
        const h_ = drag.handle;
        if (h_.includes('e')) w = Math.max(20, b.w + dx);
        if (h_.includes('s')) h = Math.max(20, b.h + dy);
        if (h_.includes('w')) {
          w = Math.max(20, b.w - dx);
          x = b.x + (b.w - w);
        }
        if (h_.includes('n')) {
          h = Math.max(20, b.h - dy);
          y = b.y + (b.h - h);
        }
        update(drag.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
      } else {
        const ang = (Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx) * 180) / Math.PI;
        let rot = drag.startRot + (ang - drag.startAngle);
        if (e.shiftKey) rot = Math.round(rot / 15) * 15;
        update(drag.id, { rotation: Math.round(rot) });
      }
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [scale, update]);

  // ── Imagen (subir) ──
  const onUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const probe = new Image();
      probe.onload = async () => {
        const layer = newImageLayer(src, design.format, { w: probe.naturalWidth, h: probe.naturalHeight });
        // insertar debajo de los textos (arriba del fondo). Preview inmediato con base64.
        setDesign((d) => ({ ...d, layers: [layer, ...d.layers] }));
        setSelectedId(layer.id);
        // Sube a R2 en segundo plano y reemplaza el src por la URL (diseño liviano).
        try {
          const res = await fetch('/api/uploads', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ dataUrl: src }),
          });
          if (res.ok) {
            const data = (await res.json()) as { url?: string };
            if (data.url) update(layer.id, { src: data.url } as Partial<Layer>);
          }
        } catch {
          /* si falla la subida, se queda el base64 (sigue funcionando) */
        }
      };
      probe.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Logo Go On (imagen oficial desde /media) ──
  const insertLogo = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const layer = newLogoLayer(src, design.format);
      const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.5;
      layer.h = Math.round(layer.w * ratio);
      layer.y = Math.round(design.format.h - layer.h - design.format.h * 0.05);
      addLayer(layer);
    };
    img.src = src;
  };

  // ── Fondo con IA ──
  const generarFondo = async (prompt: string) => {
    setBgBusy(true);
    setBgError(null);
    try {
      const res = await fetch('/api/generate/background', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ solicitudId, prompt, aspect: design.format.id }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && typeof data === 'object' && 'error' in data ? (data as { error: { message: string } }).error.message : `Error ${res.status}`;
        setBgError(msg);
        return;
      }
      const url = (data as { dataUrl?: string }).dataUrl;
      if (url) setDesign((d) => ({ ...d, background: { ...d.background, kind: 'image', src: url } }));
    } catch (err) {
      setBgError(err instanceof Error ? err.message : 'No se pudo generar el fondo.');
    } finally {
      setBgBusy(false);
    }
  };

  const patchBg = (patch: Partial<Design['background']>) =>
    setDesign((d) => ({ ...d, background: { ...d.background, ...patch } }));

  // ── Retoque final con IA (homogeneiza auto + fondo; respeta texto/logo) ──
  const harmonizar = async () => {
    setHarmBusy(true);
    setHarmError(null);
    try {
      const image = await exportPhotoBase64(design);
      const res = await fetch('/api/generate/harmonize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ solicitudId, image }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && typeof data === 'object' && 'error' in data ? (data as { error: { message: string } }).error.message : `Error ${res.status}`;
        setHarmError(msg);
        return;
      }
      const url = (data as { dataUrl?: string }).dataUrl;
      if (!url) {
        setHarmError('No se recibió la imagen retocada.');
        return;
      }
      // La imagen retocada YA contiene fondo + auto fusionados: la ponemos como
      // fondo y quitamos las capas de foto (no-logo). Texto/logo/formas siguen encima.
      setDesign((d) => ({
        ...d,
        background: { ...d.background, kind: 'image', src: url, scale: 1, offsetX: 0, offsetY: 0, blur: 0, dim: 0 },
        layers: d.layers.filter((l) => !(l.type === 'image' && !l.isLogo)),
      }));
    } catch (e) {
      setHarmError(e instanceof Error ? e.message : 'No se pudo retocar.');
    } finally {
      setHarmBusy(false);
    }
  };

  // ── Exportar ──
  const [exporting, setExporting] = useState(false);
  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await exportPng(design);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${design.format.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // ── Atajos (copiar/pegar/duplicar/borrar). Solo dentro del editor. ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const inField = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable === true;
      const editing = editingIdRef.current !== null;
      const meta = e.ctrlKey || e.metaKey;
      const selId = selectedIdRef.current;
      const getSel = () => designRef.current.layers.find((l) => l.id === selId) ?? null;

      // En campos de texto o editando una capa: dejar el copiar/pegar nativo.
      if (inField || editing) return;

      if (meta && e.key.toLowerCase() === 'c') {
        const s = getSel();
        if (s) {
          clipboardRef.current = { ...s };
          e.preventDefault();
        }
        return;
      }
      if (meta && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current) {
          pasteLayer(clipboardRef.current);
          e.preventDefault();
        }
        return;
      }
      if (meta && e.key.toLowerCase() === 'd') {
        const s = getSel();
        if (s) {
          pasteLayer(s);
          e.preventDefault();
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        e.preventDefault();
        removeLayer(selId);
        return;
      }
      if (e.key === 'Escape') {
        setFullscreen(false);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteLayer]);

  const bgLayerStyle = useMemo(() => {
    const b = design.background;
    const base: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: design.format.w, height: design.format.h };
    if (b.kind === 'image' && b.src)
      return {
        ...base,
        backgroundImage: `url(${b.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transformOrigin: 'center',
        transform: `translate(${b.offsetX}px, ${b.offsetY}px) scale(${b.scale})`,
        filter: b.blur > 0 ? `blur(${b.blur}px)` : undefined,
      };
    if (b.kind === 'gradient') return { ...base, background: `linear-gradient(${b.gradientAngle}deg, ${b.gradientFrom}, ${b.gradientTo})` };
    return { ...base, background: b.color };
  }, [design.background, design.format]);

  return (
    <div className={`${styles.editor} ${fullscreen ? styles.fullscreen : ''}`}>
      {/* ── Barra de herramientas ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button type="button" className={styles.tool} onClick={() => addLayer(newTextLayer({ x: design.format.w * 0.1, y: design.format.h * 0.4 }))}>
            <span className={styles.tIco}><TypeIcon size={12} /></span> Texto
          </button>
          <button type="button" className={styles.tool} onClick={() => addLayer(newBoxLayer({ x: design.format.w * 0.15, y: design.format.h * 0.4 }))}>
            <span className={styles.tIco}><SquareIcon size={12} /></span> Forma
          </button>
          <label className={styles.tool}>
            <span className={styles.tIco}><ImageIcon size={12} /></span> Imagen
            <input type="file" accept="image/*" hidden onChange={onUploadImage} />
          </label>
          <button type="button" className={styles.tool} onClick={() => insertLogo(LOGOS.blanco)} title="Insertar logo Go On (blanco)">
            <span className={styles.tIco}><CircleIcon size={12} /></span> Logo
          </button>
        </div>

        <div className={styles.toolGroup}>
          <select
            className={styles.select}
            value={design.format.id}
            onChange={(e) => {
              const f = FORMATS.find((x) => x.id === e.target.value);
              if (f) setFormat(f);
            }}
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolGroup} style={{ marginLeft: 'auto', flex: '0 1 220px' }}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del post"
            aria-label="Título del post"
          />
        </div>

        <div className={styles.toolGroup}>
          <button type="button" className={styles.tool} onClick={() => setFullscreen((v) => !v)}>
            <ExpandIcon size={15} /> {fullscreen ? 'Salir' : 'Editor completo'}
          </button>
          <button type="button" className={styles.tool} onClick={guardar} disabled={saveState === 'saving'} title={saveError ?? ''}>
            {saveState === 'saving' ? (
              'Guardando…'
            ) : saveState === 'saved' ? (
              <>
                <CheckIcon size={15} /> Guardado
              </>
            ) : saveState === 'error' ? (
              <>
                <AlertTriangleIcon size={15} /> Reintentar
              </>
            ) : (
              <>
                <SaveIcon size={15} /> Guardar
              </>
            )}
          </button>
          <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exportando…' : 'Descargar PNG'}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {/* ── Lienzo ── */}
        <div className={styles.stage} ref={stageRef} onPointerDown={() => setSelectedId(null)}>
          <div className={styles.artboard} style={{ width: design.format.w * scale, height: design.format.h * scale }}>
            <div className={styles.layers} style={{ width: design.format.w, height: design.format.h, transform: `scale(${scale})` }}>
              <div style={bgLayerStyle} />
              {design.background.dim > 0 && (
                <div style={{ position: 'absolute', left: 0, top: 0, width: design.format.w, height: design.format.h, background: '#000', opacity: design.background.dim }} />
              )}
              {design.layers.map((l) => (
                <LayerView
                  key={l.id}
                  layer={l}
                  selected={l.id === selectedId}
                  editing={l.id === editingId}
                  onPointerDown={(e) => onPointerDownLayer(e, l.id)}
                  onDoubleClick={() => l.type === 'text' && setEditingId(l.id)}
                  onEditCommit={(text) => {
                    update(l.id, { text } as Partial<Layer>);
                    setEditingId(null);
                  }}
                />
              ))}

              {selected && !editingId && (
                <SelectionFrame
                  layer={selected}
                  onHandle={onPointerDownHandle}
                  onRotate={onPointerDownRotate}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <aside className={styles.panel}>
          <div className={styles.panelTabs}>
            <button type="button" className={`${styles.panelTab} ${tab === 'diseno' ? styles.panelTabActive : ''}`} onClick={() => setTab('diseno')}>
              Diseño
            </button>
            <button type="button" className={`${styles.panelTab} ${tab === 'caption' ? styles.panelTabActive : ''}`} onClick={() => setTab('caption')}>
              Caption
            </button>
          </div>

          <div className={styles.panelBody}>
            {tab === 'caption' ? (
              <CaptionPanel
                solicitudId={solicitudId}
                info={info}
                modelo={layerText('Modelo')}
                tagline={layerText('Tagline')}
                onModelo={(v) => updateLayerByName('Modelo', { text: v } as Partial<Layer>)}
                onTagline={(v) => updateLayerByName('Tagline', { text: v } as Partial<Layer>)}
                caption={caption}
                onCaption={setCaption}
              />
            ) : selected ? (
              <Properties
                layer={selected}
                onChange={(patch) => update(selected.id, patch)}
                onDelete={() => removeLayer(selected.id)}
                onDuplicate={() => pasteLayer(selected)}
                onReorder={(dir) => reorder(selected.id, dir)}
              />
            ) : (
              <BackgroundPanel
                design={design}
                onPreset={(bg) => setDesign((d) => ({ ...d, background: bg }))}
                onBgPatch={patchBg}
                onAi={generarFondo}
                onLogo={insertLogo}
                onHarmonize={harmonizar}
                busy={bgBusy}
                error={bgError}
                harmBusy={harmBusy}
                harmError={harmError}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ───────────────────────── Sub-componentes ───────────────────────── */

const LayerView = ({
  layer,
  selected,
  editing,
  onPointerDown,
  onDoubleClick,
  onEditCommit,
}: {
  readonly layer: Layer;
  readonly selected: boolean;
  readonly editing: boolean;
  readonly onPointerDown: (e: React.PointerEvent) => void;
  readonly onDoubleClick: () => void;
  readonly onEditCommit: (text: string) => void;
}) => {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.w,
    height: layer.h,
    transform: `rotate(${layer.rotation}deg)`,
    opacity: layer.opacity,
    display: layer.hidden ? 'none' : undefined,
    cursor: selected ? 'move' : 'pointer',
  };

  if (layer.type === 'box') {
    return (
      <div
        style={{
          ...base,
          background: layer.fill,
          borderRadius: layer.radius,
          border: layer.borderColor ? `${layer.borderWidth}px solid ${layer.borderColor}` : undefined,
        }}
        onPointerDown={onPointerDown}
      />
    );
  }

  if (layer.type === 'image') {
    return (
      <div style={{ ...base, borderRadius: layer.radius, overflow: 'hidden' }} onPointerDown={onPointerDown}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={layer.src}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: layer.fit,
            transform: `scale(${layer.flipH ? -1 : 1}, ${layer.flipV ? -1 : 1})`,
          }}
        />
      </div>
    );
  }

  // text
  const textStyle: React.CSSProperties = {
    ...base,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    fontStyle: layer.italic ? 'italic' : 'normal',
    textDecoration: layer.underline ? 'underline' : 'none',
    textTransform: layer.uppercase ? 'uppercase' : 'none',
    textAlign: layer.align,
    color: layer.color,
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    background: layer.bg ?? 'transparent',
    borderRadius: layer.radius,
    padding: `${layer.padY}px ${layer.padX}px`,
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  if (editing) {
    return (
      <textarea
        autoFocus
        defaultValue={layer.text}
        onBlur={(e) => onEditCommit(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ ...textStyle, resize: 'none', border: '2px solid #ff6a00', outline: 'none' }}
      />
    );
  }

  return (
    <div style={textStyle} onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
      {layer.text}
    </div>
  );
};

const SelectionFrame = ({
  layer,
  onHandle,
  onRotate,
}: {
  readonly layer: Layer;
  readonly onHandle: (e: React.PointerEvent, h: HandleId) => void;
  readonly onRotate: (e: React.PointerEvent) => void;
}) => {
  const pos: Record<HandleId, React.CSSProperties> = {
    nw: { left: 0, top: 0 },
    n: { left: '50%', top: 0 },
    ne: { left: '100%', top: 0 },
    e: { left: '100%', top: '50%' },
    se: { left: '100%', top: '100%' },
    s: { left: '50%', top: '100%' },
    sw: { left: 0, top: '100%' },
    w: { left: 0, top: '50%' },
  };
  return (
    <div
      className={styles.selFrame}
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.w,
        height: layer.h,
        transform: `rotate(${layer.rotation}deg)`,
      }}
    >
      <div className={styles.rotateHandle} onPointerDown={onRotate} />
      {HANDLES.map((h) => (
        <div key={h} className={styles.handle} style={{ ...pos[h] }} onPointerDown={(e) => onHandle(e, h)} data-h={h} />
      ))}
    </div>
  );
};

/* ── Panel de propiedades por tipo ── */
const Field = ({ label, children }: { readonly label: string; readonly children: React.ReactNode }) => (
  <label className={styles.pField}>
    <span className={styles.pLabel}>{label}</span>
    {children}
  </label>
);

const ColorRow = ({ value, onChange }: { readonly value: string; readonly onChange: (v: string) => void }) => (
  <div className={styles.colorRow}>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className={styles.colorInput} />
    {BRAND_SWATCHES.map((c) => (
      <button key={c} type="button" className={styles.swatch} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
    ))}
  </div>
);

const Properties = ({
  layer,
  onChange,
  onDelete,
  onDuplicate,
  onReorder,
}: {
  readonly layer: Layer;
  readonly onChange: (patch: Partial<Layer>) => void;
  readonly onDelete: () => void;
  readonly onDuplicate: () => void;
  readonly onReorder: (dir: 'up' | 'down') => void;
}) => {
  return (
    <div className={styles.props}>
      <div className={styles.propHead}>
        <span className={styles.propTitle}>{layer.name}</span>
        <div className={styles.propActions}>
          <button type="button" className={styles.miniBtn} onClick={onDuplicate} title="Duplicar (Ctrl+D)" aria-label="Duplicar"><CopyIcon size={15} /></button>
          <button type="button" className={styles.miniBtn} onClick={() => onReorder('up')} title="Traer al frente" aria-label="Traer al frente"><ArrowUpIcon size={15} /></button>
          <button type="button" className={styles.miniBtn} onClick={() => onReorder('down')} title="Enviar atrás" aria-label="Enviar atrás"><ArrowDownIcon size={15} /></button>
          <button type="button" className={styles.miniBtn} onClick={onDelete} title="Eliminar" aria-label="Eliminar"><TrashIcon size={15} /></button>
        </div>
      </div>

      <div className={styles.grid2}>
        <Field label="X"><input className="input" type="number" value={Math.round(layer.x)} onChange={(e) => onChange({ x: Number(e.target.value) })} /></Field>
        <Field label="Y"><input className="input" type="number" value={Math.round(layer.y)} onChange={(e) => onChange({ y: Number(e.target.value) })} /></Field>
        <Field label="Ancho"><input className="input" type="number" value={Math.round(layer.w)} onChange={(e) => onChange({ w: Number(e.target.value) })} /></Field>
        <Field label="Alto"><input className="input" type="number" value={Math.round(layer.h)} onChange={(e) => onChange({ h: Number(e.target.value) })} /></Field>
        <Field label="Rotación"><input className="input" type="number" value={Math.round(layer.rotation)} onChange={(e) => onChange({ rotation: Number(e.target.value) })} /></Field>
        <Field label="Opacidad"><input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={(e) => onChange({ opacity: Number(e.target.value) })} /></Field>
      </div>

      {layer.type === 'text' && (
        <>
          <Field label="Texto">
            <textarea className="textarea" value={layer.text} onChange={(e) => onChange({ text: e.target.value } as Partial<Layer>)} style={{ minHeight: 60 }} />
          </Field>
          <Field label="Fuente">
            <select className="select" value={layer.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value } as Partial<Layer>)}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <div className={styles.grid2}>
            <Field label="Tamaño"><input className="input" type="number" value={layer.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) } as Partial<Layer>)} /></Field>
            <Field label="Grosor">
              <select className="select" value={layer.fontWeight} onChange={(e) => onChange({ fontWeight: Number(e.target.value) } as Partial<Layer>)}>
                {[400, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
          </div>
          <div className={styles.toggles}>
            <button type="button" className={`${styles.tg} ${layer.italic ? styles.tgOn : ''}`} onClick={() => onChange({ italic: !layer.italic } as Partial<Layer>)}><i>I</i></button>
            <button type="button" className={`${styles.tg} ${layer.underline ? styles.tgOn : ''}`} onClick={() => onChange({ underline: !layer.underline } as Partial<Layer>)}><u>U</u></button>
            <button type="button" className={`${styles.tg} ${layer.uppercase ? styles.tgOn : ''}`} onClick={() => onChange({ uppercase: !layer.uppercase } as Partial<Layer>)}>AA</button>
            <button type="button" className={`${styles.tg} ${layer.align === 'left' ? styles.tgOn : ''}`} onClick={() => onChange({ align: 'left' } as Partial<Layer>)} aria-label="Alinear a la izquierda"><AlignLeftIcon size={15} /></button>
            <button type="button" className={`${styles.tg} ${layer.align === 'center' ? styles.tgOn : ''}`} onClick={() => onChange({ align: 'center' } as Partial<Layer>)} aria-label="Centrar"><AlignCenterIcon size={15} /></button>
            <button type="button" className={`${styles.tg} ${layer.align === 'right' ? styles.tgOn : ''}`} onClick={() => onChange({ align: 'right' } as Partial<Layer>)} aria-label="Alinear a la derecha"><AlignRightIcon size={15} /></button>
          </div>
          <Field label="Color de texto"><ColorRow value={layer.color} onChange={(v) => onChange({ color: v } as Partial<Layer>)} /></Field>
          <Field label="Caja detrás del texto">
            <div className={styles.rowInline}>
              <button type="button" className={`${styles.tg} ${layer.bg ? styles.tgOn : ''}`} onClick={() => onChange({ bg: layer.bg ? null : '#ff6a00' } as Partial<Layer>)}>{layer.bg ? 'Con caja' : 'Sin caja'}</button>
              {layer.bg && <input type="color" value={layer.bg} onChange={(e) => onChange({ bg: e.target.value } as Partial<Layer>)} className={styles.colorInput} />}
            </div>
          </Field>
          <div className={styles.grid2}>
            <Field label="Interlineado"><input className="input" type="number" step={0.05} value={layer.lineHeight} onChange={(e) => onChange({ lineHeight: Number(e.target.value) } as Partial<Layer>)} /></Field>
            <Field label="Espaciado"><input className="input" type="number" value={layer.letterSpacing} onChange={(e) => onChange({ letterSpacing: Number(e.target.value) } as Partial<Layer>)} /></Field>
            <Field label="Radio caja"><input className="input" type="number" value={layer.radius} onChange={(e) => onChange({ radius: Number(e.target.value) } as Partial<Layer>)} /></Field>
          </div>
        </>
      )}

      {layer.type === 'box' && (
        <>
          <Field label="Relleno"><ColorRow value={layer.fill} onChange={(v) => onChange({ fill: v } as Partial<Layer>)} /></Field>
          <div className={styles.grid2}>
            <Field label="Radio"><input className="input" type="number" value={layer.radius} onChange={(e) => onChange({ radius: Number(e.target.value) } as Partial<Layer>)} /></Field>
            <Field label="Grosor borde"><input className="input" type="number" value={layer.borderWidth} onChange={(e) => onChange({ borderWidth: Number(e.target.value) } as Partial<Layer>)} /></Field>
          </div>
          <Field label="Color borde">
            <div className={styles.rowInline}>
              <button type="button" className={`${styles.tg} ${layer.borderColor ? styles.tgOn : ''}`} onClick={() => onChange({ borderColor: layer.borderColor ? null : '#ffffff', borderWidth: layer.borderWidth || 4 } as Partial<Layer>)}>{layer.borderColor ? 'Con borde' : 'Sin borde'}</button>
              {layer.borderColor && <input type="color" value={layer.borderColor} onChange={(e) => onChange({ borderColor: e.target.value } as Partial<Layer>)} className={styles.colorInput} />}
            </div>
          </Field>
        </>
      )}

      {layer.type === 'image' && (
        <>
          <div className={styles.toggles}>
            <button type="button" className={`${styles.tg} ${layer.flipH ? styles.tgOn : ''}`} onClick={() => onChange({ flipH: !layer.flipH } as Partial<Layer>)}><FlipHorizontalIcon size={15} /> Voltear H</button>
            <button type="button" className={`${styles.tg} ${layer.flipV ? styles.tgOn : ''}`} onClick={() => onChange({ flipV: !layer.flipV } as Partial<Layer>)}><FlipVerticalIcon size={15} /> Voltear V</button>
          </div>
          <div className={styles.grid2}>
            <Field label="Ajuste">
              <select className="select" value={layer.fit} onChange={(e) => onChange({ fit: e.target.value as 'cover' | 'contain' } as Partial<Layer>)}>
                <option value="cover">Rellenar</option>
                <option value="contain">Contener</option>
              </select>
            </Field>
            <Field label="Radio"><input className="input" type="number" value={layer.radius} onChange={(e) => onChange({ radius: Number(e.target.value) } as Partial<Layer>)} /></Field>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Panel de fondo (cuando no hay selección) ── */
const BackgroundPanel = ({
  design,
  onPreset,
  onBgPatch,
  onAi,
  onLogo,
  onHarmonize,
  busy,
  error,
  harmBusy,
  harmError,
}: {
  readonly design: Design;
  readonly onPreset: (bg: Design['background']) => void;
  readonly onBgPatch: (patch: Partial<Design['background']>) => void;
  readonly onAi: (prompt: string) => void;
  readonly onLogo: (src: string) => void;
  readonly onHarmonize: () => void;
  readonly busy: boolean;
  readonly error: string | null;
  readonly harmBusy: boolean;
  readonly harmError: string | null;
}) => (
  <div className={styles.props}>
    <p className={styles.hintBig}>Selecciona una capa para editarla, o define el fondo:</p>

    {/* Retoque final con IA */}
    <div className={styles.harmCard}>
      <div className={styles.propTitle}>Retoque final con IA</div>
      <p className={styles.hintSmall}>
        Fusiona el auto con el fondo: unifica luz, color y sombra para que no se vea recortado. Respeta el texto y el
        logo (quedan nítidos encima). Hazlo al final.
      </p>
      {harmError && <p className={styles.aiErr}>{harmError}</p>}
      <button type="button" className="btn btn-primary" onClick={onHarmonize} disabled={harmBusy} style={{ width: '100%' }}>
        {harmBusy ? (
          'Retocando…'
        ) : (
          <>
            <SparklesIcon size={16} /> Fusionar y homogeneizar
          </>
        )}
      </button>
    </div>

    {/* Acomodo del fondo imagen */}
    {design.background.kind === 'image' && (
      <div className={styles.props} style={{ gap: 10 }}>
        <div className={styles.propTitle}>Acomodar fondo</div>
        <Field label={`Zoom · ${design.background.scale.toFixed(2)}×`}>
          <input type="range" min={1} max={3} step={0.02} value={design.background.scale} onChange={(e) => onBgPatch({ scale: Number(e.target.value) })} />
        </Field>
        <div className={styles.grid2}>
          <Field label="Mover X"><input type="range" min={-600} max={600} step={4} value={design.background.offsetX} onChange={(e) => onBgPatch({ offsetX: Number(e.target.value) })} /></Field>
          <Field label="Mover Y"><input type="range" min={-600} max={600} step={4} value={design.background.offsetY} onChange={(e) => onBgPatch({ offsetY: Number(e.target.value) })} /></Field>
        </div>
        <div className={styles.grid2}>
          <Field label={`Desenfoque · ${design.background.blur}px`}><input type="range" min={0} max={40} step={1} value={design.background.blur} onChange={(e) => onBgPatch({ blur: Number(e.target.value) })} /></Field>
          <Field label={`Oscurecer · ${Math.round(design.background.dim * 100)}%`}><input type="range" min={0} max={0.85} step={0.05} value={design.background.dim} onChange={(e) => onBgPatch({ dim: Number(e.target.value) })} /></Field>
        </div>
        <button type="button" className={styles.miniBtn} style={{ width: 'auto', padding: '6px 10px' }} onClick={() => onBgPatch({ scale: 1, offsetX: 0, offsetY: 0, blur: 0, dim: 0 })}>
          Restablecer acomodo
        </button>
      </div>
    )}

    <div className={styles.propTitle}>Logo Go On</div>
    <div className={styles.presetGrid}>
      <button type="button" className={styles.preset} onClick={() => onLogo(LOGOS.blanco)}>
        <CircleIcon size={15} /> Logo blanco
      </button>
      <button type="button" className={styles.preset} onClick={() => onLogo(LOGOS.color)}>
        <CircleIcon size={15} /> Logo color
      </button>
    </div>

    <div className={styles.propTitle}>Fondos rápidos</div>
    <div className={styles.presetGrid}>
      {BG_PRESETS.map((p) => (
        <button key={p.label} type="button" className={styles.preset} onClick={() => onPreset(p.bg())}>
          {p.label}
        </button>
      ))}
    </div>

    <Field label="Color sólido">
      <ColorRow value={design.background.color} onChange={(v) => onPreset({ ...design.background, kind: 'solid', color: v })} />
    </Field>

    <div className={styles.propTitle} style={{ marginTop: 8 }}>Fondo con IA (para autos)</div>
    {error && <p className={styles.aiErr}>{error}</p>}
    <div className={styles.aiList}>
      {AI_BG_PROMPTS.map((p) => (
        <button key={p.label} type="button" className={styles.aiBtn} disabled={busy} onClick={() => onAi(p.prompt)}>
          {busy ? (
            'Generando…'
          ) : (
            <>
              <SparklesIcon size={15} /> {p.label}
            </>
          )}
        </button>
      ))}
    </div>
    <p className={styles.hintSmall}>Genera un fondo sin auto; luego coloca la foto del auto encima. Pronto podrás subir imágenes de contexto para entrenar el estilo.</p>
  </div>
);
