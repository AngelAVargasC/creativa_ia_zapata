'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCopyRequestSchema } from '@/modules/content-generation/schema';
import { SparklesIcon } from '@/components/shell/icons';
import styles from './generar.module.css';

type Platform = 'facebook' | 'instagram';
type Tone = 'cercano' | 'profesional' | 'divertido' | 'inspirador';
type Status = 'idle' | 'streaming' | 'done' | 'error';

interface FormState {
  agencyName: string;
  voice: string;
  bannedWords: string;
  platform: Platform;
  objective: string;
  tone: Tone;
  product: string;
  maxChars: number;
}

interface ApiError {
  readonly error: { readonly code: string; readonly message: string };
}

const TONES: readonly Tone[] = ['cercano', 'profesional', 'divertido', 'inspirador'];

const INITIAL: FormState = {
  agencyName: '',
  voice: '',
  bannedWords: '',
  platform: 'instagram',
  objective: '',
  tone: 'cercano',
  product: '',
  maxChars: 280,
};

const isApiError = (value: unknown): value is ApiError =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  typeof (value as { error: unknown }).error === 'object';

export const GenerarClient = () => {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<Status>('idle');
  const [displayed, setDisplayed] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Buffer de lo recibido (ref) vs. lo mostrado (state). Un loop de animacion
  // "escribe" el texto a ritmo suave, desacoplado de las rafagas de la red.
  const bufferRef = useRef('');
  const shownRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const finalize = () => {
    const text = bufferRef.current;
    if (text.trim().length === 0) {
      setStatus('error');
      setError('El modelo no devolvió contenido.');
    } else {
      setStatus('done');
    }
  };

  // Revela algunos caracteres por frame. El paso se adapta a lo pendiente:
  // escribe despacio cuando va al dia y acelera si se acumula, asi nunca
  // queda rezagado respecto al stream (sin latencia perceptible).
  const tick = () => {
    const target = bufferRef.current;
    if (shownRef.current < target.length) {
      const remaining = target.length - shownRef.current;
      const step = Math.max(1, Math.min(6, Math.ceil(remaining / 6)));
      shownRef.current += step;
      setDisplayed(target.slice(0, shownRef.current));
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
      if (finishedRef.current) finalize();
    }
  };

  const ensureTyping = () => {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCopied(false);

    const payload = {
      brand: {
        agencyName: form.agencyName,
        voice: form.voice,
        bannedWords: form.bannedWords
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean),
      },
      brief: {
        platform: form.platform,
        objective: form.objective,
        tone: form.tone,
        product: form.product,
        maxChars: form.maxChars,
      },
    };

    const parsed = generateCopyRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus('error');
      setError(parsed.error.issues[0]?.message ?? 'Revisa los campos del formulario.');
      return;
    }

    // Reinicia el "typewriter".
    stopRaf();
    bufferRef.current = '';
    shownRef.current = 0;
    finishedRef.current = false;
    setDisplayed('');
    setStatus('streaming');

    try {
      const res = await fetch('/api/generate/copy?stream=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok || !res.body) {
        const data: unknown = await res.json().catch(() => null);
        setStatus('error');
        setError(isApiError(data) ? data.error.message : `Error ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        ensureTyping();
      }
      bufferRef.current += decoder.decode();
      finishedRef.current = true;
      ensureTyping();
    } catch (e) {
      stopRaf();
      setStatus('error');
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor.');
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(bufferRef.current);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  };

  const streaming = status === 'streaming';

  return (
    <div className={styles.grid}>
      {/* ── Brief ── */}
      <motion.section
        className={`card ${styles.panel}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <h2 className={styles.panelTitle}>Brief</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.row}>
            <label className="field">
              <span className="field-label">Agencia</span>
              <input
                className="input"
                value={form.agencyName}
                onChange={(e) => set('agencyName', e.target.value)}
                placeholder="Agencia Norte"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Producto / servicio</span>
              <input
                className="input"
                value={form.product}
                onChange={(e) => set('product', e.target.value)}
                placeholder="Cafetera premium"
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Voz de marca</span>
            <textarea
              className="textarea"
              value={form.voice}
              onChange={(e) => set('voice', e.target.value)}
              placeholder="Cercana, optimista y clara. Profesional sin sonar corporativo."
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Objetivo de la pieza</span>
            <input
              className="input"
              value={form.objective}
              onChange={(e) => set('objective', e.target.value)}
              placeholder="Anunciar el lanzamiento de la nueva línea"
              required
            />
          </label>

          <div className={styles.row}>
            <label className="field">
              <span className="field-label">Plataforma</span>
              <select
                className="select"
                value={form.platform}
                onChange={(e) => set('platform', e.target.value as Platform)}
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">Tono</span>
              <select className="select" value={form.tone} onChange={(e) => set('tone', e.target.value as Tone)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className="field">
              <span className="field-label">Palabras vetadas</span>
              <input
                className="input"
                value={form.bannedWords}
                onChange={(e) => set('bannedWords', e.target.value)}
                placeholder="gratis, barato"
              />
              <span className="hint">Separadas por comas (opcional).</span>
            </label>
            <label className="field">
              <span className="field-label">Máx. caracteres</span>
              <input
                className="input"
                type="number"
                min={40}
                max={2200}
                value={form.maxChars}
                onChange={(e) => set('maxChars', Number(e.target.value))}
                required
              />
            </label>
          </div>

          <div className={styles.actions}>
            <span className="hint">El tenant se resuelve desde tu sesión.</span>
            <button className="btn btn-primary" type="submit" disabled={streaming} aria-busy={streaming}>
              {streaming ? (
                <>
                  <motion.span
                    className={styles.spinner}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, ease: 'linear', duration: 0.7 }}
                  />
                  Generando…
                </>
              ) : (
                <>
                  <SparklesIcon size={16} />
                  Generar copy
                </>
              )}
            </button>
          </div>
        </form>
      </motion.section>

      {/* ── Resultado en vivo ── */}
      <motion.section
        className={`card ${styles.panel} ${styles.resultPanel}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className={styles.resultHeader}>
          <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>
            Resultado
          </h2>
          {status === 'done' && (
            <button className="btn btn-ghost" type="button" onClick={onCopy}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          )}
        </div>

        <div className={styles.resultBody}>
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                className={styles.placeholder}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.placeholderIcon}>
                  <SparklesIcon size={22} />
                </span>
                <p className={styles.placeholderTitle}>Tu copy aparecerá aquí</p>
                <p style={{ margin: 0 }}>Completa el brief y pulsa «Generar» para verlo escribirse en vivo.</p>
              </motion.div>
            )}

            {streaming && displayed.length === 0 && (
              <motion.div key="skeleton" className={styles.skeleton} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[92, 78, 85, 60].map((w, i) => (
                  <motion.span
                    key={i}
                    className={styles.skeletonLine}
                    style={{ width: `${w}%` }}
                    animate={{ backgroundPositionX: ['200%', '-200%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear', delay: i * 0.12 }}
                  />
                ))}
              </motion.div>
            )}

            {(displayed.length > 0 || status === 'done') && status !== 'error' && (
              <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <p className={styles.output} aria-live="polite">
                  {displayed}
                  {streaming && (
                    <motion.span
                      className={styles.cursor}
                      animate={{ opacity: [1, 0.15, 1] }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                    />
                  )}
                </p>
                <div className={styles.meta}>
                  <span className={styles.count}>
                    {displayed.length} / {form.maxChars} caracteres
                  </span>
                  {copied && <span className={styles.copied}>copiado al portapapeles</span>}
                </div>
              </motion.div>
            )}

            {status === 'error' && error && (
              <motion.div
                key="error"
                className={styles.errorBox}
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span aria-hidden="true">⚠</span>
                <span>
                  <strong>No se pudo generar. </strong>
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
};
