'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { STATUS_ORDER, STATUS_META } from '@/modules/solicitudes/labels';
import type { SolicitudStatus } from '@/modules/solicitudes/schema';
import { updateSolicitudAction } from '../actions';
import styles from '../solicitudes.module.css';

const SaveLinkButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ghost" type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar link'}
    </button>
  );
};

/**
 * Control de gestión del operador: estatus (se guarda al instante al cambiarlo)
 * y link final. Es la acción principal del operador, por eso va arriba y visible.
 */
export const StatusControl = ({
  id,
  status,
  linkFinal,
}: {
  readonly id: string;
  readonly status: SolicitudStatus;
  readonly linkFinal: string;
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateSolicitudAction} className={styles.gestion}>
      <input type="hidden" name="id" value={id} />

      <label className="field">
        <span className="field-label">Estatus</span>
        <select
          className="select"
          name="status"
          defaultValue={status}
          onChange={() => formRef.current?.requestSubmit()}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <span className="hint">Se guarda al instante. La agencia verá este estatus en su solicitud.</span>
      </label>

      <label className="field">
        <span className="field-label">Link final</span>
        <div className={styles.inlineField}>
          <input
            className="input"
            name="link_final"
            type="text"
            defaultValue={linkFinal}
            placeholder="https://… (posteo listo para publicar)"
          />
          <SaveLinkButton />
        </div>
        <span className="hint">Pega aquí el link del posteo final cuando esté listo.</span>
      </label>
    </form>
  );
};
