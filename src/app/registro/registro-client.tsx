'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerAction } from './actions';
import type { AvailableAgency } from '@/modules/registro/service';
import styles from '@/app/login/login.module.css';

interface Props {
  readonly agencies: readonly AvailableAgency[];
  readonly catalogError: boolean;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Creando cuenta…' : 'Crear cuenta'}
    </button>
  );
};

/** Deriva la marca (primer token del nombre) para agrupar el listado. */
const marcaOf = (name: string): string => name.split(' ')[0]?.toUpperCase() ?? 'OTRAS';

export const RegistroClient = ({ agencies, catalogError }: Props) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  const grouped = useMemo(() => {
    const map = new Map<string, AvailableAgency[]>();
    for (const a of agencies) {
      const marca = marcaOf(a.name);
      const list = map.get(marca) ?? [];
      list.push(a);
      map.set(marca, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [agencies]);

  return (
    <form action={registerAction} className={styles.form}>
      <input type="hidden" name="mode" value={mode} />

      {/* Selector de modo */}
      <div className="field">
        <span className="field-label">Tu agencia</span>
        <div className="segmented" role="tablist" aria-label="Cómo eliges tu agencia">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'existing'}
            className={`segmented-btn ${mode === 'existing' ? 'is-active' : ''}`}
            onClick={() => setMode('existing')}
          >
            Del listado
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            className={`segmented-btn ${mode === 'new' ? 'is-active' : ''}`}
            onClick={() => setMode('new')}
          >
            Agregar nueva
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        <label className="field">
          <span className="field-label">Selecciona tu sucursal</span>
          <select className="select" name="agencyId" defaultValue="" required={mode === 'existing'}>
            <option value="" disabled>
              {catalogError ? 'No se pudo cargar el catálogo' : 'Elige una sucursal…'}
            </option>
            {grouped.map(([marca, list]) => (
              <optgroup key={marca} label={marca}>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="hint">¿No aparece? Usa «Agregar nueva».</span>
        </label>
      ) : (
        <>
          <label className="field">
            <span className="field-label">Nombre de la agencia</span>
            <input className="input" name="nombre" placeholder="Ford Nueva Sucursal" required={mode === 'new'} />
          </label>
          <label className="field">
            <span className="field-label">Dirección (opcional)</span>
            <input className="input" name="address" placeholder="Calle, colonia, ciudad" />
          </label>
        </>
      )}

      <label className="field">
        <span className="field-label">Email</span>
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span className="field-label">Contraseña</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="hint">Mínimo 8 caracteres.</span>
      </label>

      <SubmitButton />
    </form>
  );
};
