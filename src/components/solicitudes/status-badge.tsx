import { STATUS_META } from '@/modules/solicitudes/labels';
import type { SolicitudStatus } from '@/modules/solicitudes/schema';

/** Chip de estatus con tono segun el estado. */
export const StatusBadge = ({ status }: { readonly status: SolicitudStatus }) => {
  const meta = STATUS_META[status];
  return (
    <span className="badge" data-tone={meta.tone}>
      {meta.label}
    </span>
  );
};
