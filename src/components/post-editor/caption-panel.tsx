'use client';

import { useState } from 'react';
import styles from './post-editor.module.css';

interface Props {
  readonly solicitudId?: string;
  readonly info: string;
  /** Enlazados a las capas del diseño para actualizar la imagen en vivo. */
  readonly modelo: string;
  readonly tagline: string;
  readonly onModelo: (v: string) => void;
  readonly onTagline: (v: string) => void;
  /** Caption controlado por el editor (para poder guardarlo). */
  readonly caption: string;
  readonly onCaption: (v: string) => void;
}

interface ApiError {
  readonly error: { readonly code: string; readonly message: string };
}
const isApiError = (v: unknown): v is ApiError => typeof v === 'object' && v !== null && 'error' in v;

/**
 * Panel de datos + caption. Modelo y Tagline editan las capas del diseño en vivo
 * (la imagen se actualiza al escribir); precio/specs/extra alimentan el caption.
 */
export const CaptionPanel = ({ solicitudId, info, modelo, tagline, onModelo, onTagline, caption, onCaption }: Props) => {
  const [antes, setAntes] = useState('');
  const [ahora, setAhora] = useState('');
  const [spec, setSpec] = useState('');
  const [extra, setExtra] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generar = async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/generate/post-caption', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ solicitudId, modelo, tagline, precioAntes: antes, precioAhora: ahora, spec, extra, info }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('error');
        setError(isApiError(data) ? data.error.message : `Error ${res.status}`);
        return;
      }
      onCaption((data as { text?: string }).text ?? '');
      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'No se pudo conectar.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className={styles.props}>
      <p className={styles.hintSmall}>Modelo y Tagline actualizan la imagen en vivo. Precio y specs alimentan el caption.</p>
      <div className={styles.grid2}>
        <label className="field"><span className="field-label">Modelo</span><input className="input" value={modelo} onChange={(e) => onModelo(e.target.value)} placeholder="Ej: Volvo XC60" /></label>
        <label className="field"><span className="field-label">Tagline / año</span><input className="input" value={tagline} onChange={(e) => onTagline(e.target.value)} placeholder="Ej: Recharge 2024" /></label>
        <label className="field"><span className="field-label">Precio antes</span><input className="input" value={antes} onChange={(e) => setAntes(e.target.value)} placeholder="Ej: 850,000" /></label>
        <label className="field"><span className="field-label">Precio ahora</span><input className="input" value={ahora} onChange={(e) => setAhora(e.target.value)} placeholder="Ej: 690,000" /></label>
      </div>
      <label className="field"><span className="field-label">Specs</span><input className="input" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Ej: 2.0L Turbo Híbrido AWD" /></label>
      <label className="field"><span className="field-label">Extra</span><input className="input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={'Ej: rines 19", un solo dueño'} /></label>

      <div className={styles.rowInline} style={{ marginTop: 4 }}>
        <button type="button" className="btn btn-ghost" onClick={generar} disabled={status === 'loading'}>
          {status === 'loading' ? 'Generando…' : caption ? 'Regenerar' : 'Generar con IA'}
        </button>
        {caption && <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? '¡Copiado!' : 'Copiar'}</button>}
      </div>
      {error && <p className={styles.aiErr}>{error}</p>}
      <textarea
        className="textarea"
        value={caption}
        onChange={(e) => onCaption(e.target.value)}
        placeholder="Pulsa «Generar con IA» para redactar el caption, o escríbelo aquí."
        style={{ minHeight: 220, marginTop: 8 }}
      />
      {info && <p className={styles.hintSmall}>Info de la solicitud: {info}</p>}
    </div>
  );
};
